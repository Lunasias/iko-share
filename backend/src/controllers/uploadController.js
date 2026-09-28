const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');

// Ensure local uploads folder exists for local environments
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {
  // Read-only filesystem in some serverless environments; ignore
}

// Upload Image Handler
const uploadImage = async (req, res) => {
  try {
    let fileBuffer;
    let mimeType = 'image/jpeg';
    let originalName = 'upload.jpg';

    // Handle Multipart file from multer
    if (req.file) {
      fileBuffer = req.file.buffer;
      mimeType = req.file.mimetype || 'image/jpeg';
      originalName = req.file.originalname || 'upload.jpg';
    } else if (req.body && req.body.base64) {
      // Handle Base64 string payload fallback
      const base64Str = req.body.base64;
      const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        fileBuffer = Buffer.from(matches[2], 'base64');
      } else {
        fileBuffer = Buffer.from(base64Str, 'base64');
      }
      originalName = req.body.filename || 'upload.jpg';
    } else {
      return res.status(400).json({ success: false, message: 'กรุณาเลือกไฟล์รูปภาพที่ต้องการอัปโหลด' });
    }

    // Validate size (max 8MB)
    if (fileBuffer.length > 8 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'ขนาดไฟล์ภาพต้องไม่เกิน 8 MB' });
    }

    // Validate mime type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(mimeType)) {
      return res.status(400).json({ success: false, message: 'รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, WEBP, GIF, SVG)' });
    }

    const userId = req.user ? (req.user.user_id || req.user.id) : null;
    const extension = path.extname(originalName) || `.${mimeType.split('/')[1] || 'jpg'}`;
    const cleanExt = extension.startsWith('.') ? extension : `.${extension}`;
    const imageId = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}${cleanExt}`;

    // Optional Cloudinary Upload if configured
    if (process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)) {
      try {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_URL.split('@')[1];
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (cloudName && apiKey && apiSecret) {
          const timestamp = Math.floor(Date.now() / 1000);
          const sigString = `timestamp=${timestamp}${apiSecret}`;
          const signature = crypto.createHash('sha1').update(sigString).digest('hex');

          const formData = new FormData();
          formData.append('file', `data:${mimeType};base64,${fileBuffer.toString('base64')}`);
          formData.append('timestamp', timestamp);
          formData.append('api_key', apiKey);
          formData.append('signature', signature);
          formData.append('folder', 'ikoshare');

          const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData,
          });
          const cloudData = await cloudRes.json();
          if (cloudData.secure_url) {
            return res.json({
              success: true,
              message: 'อัปโหลดรูปภาพขึ้น Cloudinary สำเร็จ',
              url: cloudData.secure_url,
              image_id: imageId,
              size: fileBuffer.length,
            });
          }
        }
      } catch (cloudErr) {
        console.warn('Cloudinary upload fallback to persistent database storage:', cloudErr.message);
      }
    }

    // Save to Database `uploaded_images` table (works seamlessly on Vercel Serverless + Neon)
    await db.query(
      `INSERT INTO uploaded_images (image_id, filename, mime_type, data, size_bytes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (image_id) DO UPDATE SET data = EXCLUDED.data, size_bytes = EXCLUDED.size_bytes`,
      [imageId, originalName, mimeType, fileBuffer, fileBuffer.length, userId]
    );

    // Also attempt saving to local disk if running locally
    try {
      if (fs.existsSync(UPLOADS_DIR)) {
        fs.writeFileSync(path.join(UPLOADS_DIR, imageId), fileBuffer);
      }
    } catch (e) {
      // Ignored for serverless
    }

    const imageUrl = `/api/upload/file/${imageId}`;
    res.json({
      success: true,
      message: 'อัปโหลดรูปภาพสำเร็จ',
      url: imageUrl,
      image_id: imageId,
      size: fileBuffer.length,
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + (error.message || String(error)) });
  }
};

// Serve Uploaded Image with HTTP Caching
const getUploadedImage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).send('Invalid image identifier');
    }

    // Check ETag for 304 Not Modified
    const clientEtag = req.headers['if-none-match'];
    const etag = `"${id}"`;
    if (clientEtag && clientEtag === etag) {
      return res.status(304).end();
    }

    // 1. First check Neon PostgreSQL table
    const result = await db.query(
      'SELECT mime_type, data, size_bytes FROM uploaded_images WHERE image_id = $1',
      [id]
    );

    if (result.rows && result.rows.length > 0) {
      const row = result.rows[0];
      res.set({
        'Content-Type': row.mime_type || 'image/jpeg',
        'Content-Length': row.size_bytes || row.data.length,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': etag,
      });
      return res.send(row.data);
    }

    // 2. Check local disk fallback
    const localPath = path.join(UPLOADS_DIR, id);
    if (fs.existsSync(localPath)) {
      return res.sendFile(localPath, {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
          'ETag': etag,
        },
      });
    }

    return res.status(404).json({ success: false, message: 'ไม่พบไฟล์รูปภาพที่ระบุ' });
  } catch (error) {
    console.error('Serve image error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการแสดงผลรูปภาพ' });
  }
};

module.exports = {
  uploadImage,
  getUploadedImage,
};
