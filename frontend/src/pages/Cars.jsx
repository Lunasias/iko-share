import React, { useState, useEffect, useRef } from 'react';
import API, { uploadImage } from '../services/api';
import CarLoader from '../components/CarLoader';
import { useTheme } from '../context/ThemeContext';
import {
  Car, Plus, Trash2, AlertCircle, CheckCircle, ShieldCheck,
  Camera, Upload, Eye, X, Clock, AlertTriangle, ShieldAlert,
  Image as ImageIcon, CheckCircle2, RefreshCw
} from 'lucide-react';

export default function Cars() {
  const { isTh } = useTheme();
  const [cars, setCars] = useState([]);
  const [licensePlate, setLicensePlate] = useState('');
  const [model, setModel] = useState('');
  const [capacity, setCapacity] = useState(4);

  // Vehicle photo & upload state
  const [carImageUrl, setCarImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Image preview modal state
  const [previewModalUrl, setPreviewModalUrl] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/cars/my');
      if (res.data.success) {
        setCars(res.data.cars || []);
      } else {
        setError(String(res.data.message || 'ไม่สามารถโหลดข้อมูลรถได้'));
      }
    } catch (err) {
      console.error('Fetch cars error:', err);
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลรถ'));
    } finally {
      setLoading(false);
    }
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError(isTh ? 'กรุณาเลือกไฟล์ที่เป็นรูปภาพเท่านั้น' : 'Please select an image file only');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError(isTh ? 'ขนาดไฟล์รูปภาพต้องไม่เกิน 8 MB' : 'Image size must not exceed 8 MB');
      return;
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
    setUploadError('');
    setUploadingImage(true);

    try {
      const uploadRes = await uploadImage(file);
      if (uploadRes && uploadRes.url) {
        setCarImageUrl(uploadRes.url);
      } else {
        throw new Error(uploadRes?.message || 'ไม่ได้รับ URL รูปภาพจากเซิร์ฟเวอร์');
      }
    } catch (err) {
      console.error('Upload vehicle photo error:', err);
      setUploadError(isTh ? 'อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' : 'Failed to upload photo. Please try again.');
      setImagePreview('');
      setCarImageUrl('');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemovePhoto = () => {
    setCarImageUrl('');
    setImagePreview('');
    setUploadError('');
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!carImageUrl) {
      setError(isTh ? 'กรุณาถ่ายภาพหรือแนบรูปถ่ายป้ายทะเบียนรถ เพื่อส่งให้แอดมินตรวจสอบ' : 'Please take or upload a photo of the vehicle license plate for admin verification');
      return;
    }

    setSubmitting(true);

    try {
      const res = await API.post('/cars', {
        license_plate: licensePlate.trim(),
        model: model.trim(),
        capacity: parseInt(capacity),
        car_image_url: carImageUrl,
      });

      if (res.data.success) {
        setSuccessMsg(String(res.data.message || (isTh ? 'ลงทะเบียนรถยนต์สำเร็จ ข้อมูลถูกส่งให้แอดมินตรวจสอบแล้ว' : 'Vehicle registered and submitted for admin review')));
        setLicensePlate('');
        setModel('');
        setCapacity(4);
        handleRemovePhoto();
        fetchCars();
      } else {
        setError(String(res.data.message || (isTh ? 'ไม่สามารถลงทะเบียนรถได้' : 'Failed to register vehicle')));
      }
    } catch (err) {
      console.error('Add car error:', err);
      setError(String(err.response?.data?.message || err.message || (isTh ? 'เกิดข้อผิดพลาดในการลงทะเบียนรถ' : 'Error registering vehicle')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCar = async (plate) => {
    if (!window.confirm(isTh ? `คุณต้องการลบข้อมูลรถทะเบียน ${plate} หรือไม่?` : `Are you sure you want to delete vehicle with plate ${plate}?`)) return;
    try {
      const res = await API.delete(`/cars/${plate}`);
      if (res.data.success) {
        setSuccessMsg(String(res.data.message));
        fetchCars();
      } else {
        setError(String(res.data.message));
      }
    } catch (err) {
      setError(String(err.response?.data?.message || err.message || (isTh ? 'เกิดข้อผิดพลาดในการลบข้อมูลรถ' : 'Error deleting vehicle')));
    }
  };

  if (loading) {
    return <CarLoader text={isTh ? "กำลังโหลดข้อมูลยานพาหนะ..." : "Loading vehicles..."} />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-2xs">
            <Car className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
              {isTh ? 'ระบบลงทะเบียนรถยนต์ (Car Registration)' : 'Vehicle Registration (Car Registration)'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {isTh ? 'ลงทะเบียนรถและถ่ายภาพป้ายทะเบียนเพื่อส่งให้แอดมินตรวจสอบความถูกต้องก่อนเปิดทริป' : 'Register your vehicle with license plate photo for admin verification'}
            </p>
          </div>
        </div>
        <button
          onClick={fetchCars}
          className="self-start sm:self-auto px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{isTh ? 'รีเฟรชข้อมูล' : 'Refresh'}</span>
        </button>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs space-y-1.5 shadow-2xs">
        <div className="font-extrabold flex items-center gap-2 text-blue-950">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{isTh ? 'มาตรฐานความปลอดภัยในการเดินทาง (Safety First)' : 'Vehicle Verification Standard'}</span>
        </div>
        <p className="text-blue-800 leading-relaxed text-[11px]">
          {isTh
            ? 'เพื่อให้ผู้โดยสารทุกคนมั่นใจในความปลอดภัย รถยนต์ที่ลงทะเบียนใหม่จะต้องมีภาพถ่ายป้ายทะเบียนชัดเจนและผ่านการตรวจสอบโดยผู้ดูแลระบบ (Admin) ก่อน จึงจะสามารถใช้สร้างเที่ยวเดินทางแบบคาร์พูลได้'
            : 'For passenger safety, all newly registered vehicles must include a clear photo of the license plate and be approved by an administrator before offering carpool trips.'}
        </p>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-3 shadow-2xs">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3 font-semibold shadow-2xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Register New Car Form */}
      <div className="travel-card p-6 sm:p-8 space-y-6 border border-slate-200 shadow-xs">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            <span>{isTh ? 'เพิ่มและลงทะเบียนรถยนต์คันใหม่' : 'Register New Vehicle'}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {isTh ? 'กรอกรายละเอียดรถยนต์และแนบภาพถ่ายป้ายทะเบียน' : 'Enter vehicle specifications and upload a license plate photo'}
          </p>
        </div>

        <form onSubmit={handleAddCar} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* License Plate */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <span>{isTh ? 'เลขทะเบียนรถ' : 'License Plate'}</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={isTh ? "เช่น กก-1234 ชุมพร" : "e.g. 1AB-1234 BKK"}
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                className="w-full px-4 py-3 travel-input text-xs font-medium"
              />
              <span className="text-[10px] text-slate-400 block">
                {isTh ? 'ระบุหมวดอักษร ตัวเลข และจังหวัด' : 'Include letters, numbers, and province'}
              </span>
            </div>

            {/* Model */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <span>{isTh ? 'ยี่ห้อ / รุ่นรถ' : 'Make / Model'}</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={isTh ? "เช่น Honda City, Toyota Yaris" : "e.g. Honda City, Toyota Yaris"}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-4 py-3 travel-input text-xs font-medium"
              />
              <span className="text-[10px] text-slate-400 block">
                {isTh ? 'ระบุยี่ห้อและรุ่นรถที่ใช้งานจริง' : 'Specify actual car make and model'}
              </span>
            </div>

            {/* Capacity */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <span>{isTh ? 'ความจุผู้โดยสารสูงสุด' : 'Max Passenger Capacity'}</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="15"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-4 py-3 travel-input text-xs font-bold text-center"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold pointer-events-none">
                  {isTh ? 'ที่นั่ง' : 'seats'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block text-center">
                {isTh ? 'ไม่รวมที่นั่งคนขับ (1-15)' : 'Excluding driver (1-15)'}
              </span>
            </div>
          </div>

          {/* Photo Capture & Upload Section */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>{isTh ? 'รูปถ่ายป้ายทะเบียนรถยนต์ (ส่งให้แอดมินตรวจสอบ)' : 'Vehicle License Plate Photo (For Admin Review)'}</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500">
                {isTh ? 'รองรับภาพถ่าย JPG, PNG, WEBP (ไม่เกิน 8MB)' : 'Supports JPG, PNG, WEBP (max 8MB)'}
              </span>
            </div>

            {/* Hidden file inputs for Camera and File Picker */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleImageFileChange}
              className="hidden"
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageFileChange}
              className="hidden"
            />

            {imagePreview || carImageUrl ? (
              <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-xl bg-white border border-slate-200">
                <div className="relative group w-36 h-24 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 shadow-2xs">
                  <img
                    src={imagePreview || carImageUrl}
                    alt="ป้ายทะเบียนรถที่อัปโหลด"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPreviewModalUrl(imagePreview || carImageUrl)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                    title={isTh ? "ดูภาพขนาดเต็ม" : "View full image"}
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{isTh ? 'อัปโหลดภาพถ่ายป้ายทะเบียนสำเร็จแล้ว' : 'Plate photo uploaded successfully'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {isTh ? 'ภาพนี้จะถูกส่งไปที่ระบบผู้ดูแลระบบ (Admin) เพื่อตรวจสอบความถูกต้องของรถ' : 'This photo will be securely submitted to Admin for verification'}
                  </p>
                  <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewModalUrl(imagePreview || carImageUrl)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isTh ? 'ดูภาพขยาย' : 'Zoom'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isTh ? 'เปลี่ยนรูป' : 'Change Photo'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center space-y-3 bg-white/60 transition-colors">
                {uploadingImage ? (
                  <div className="py-4 space-y-2">
                    <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-bold text-slate-700">
                      {isTh ? 'กำลังอัปโหลดและประมวลผลรูปถ่าย...' : 'Uploading and processing photo...'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-extrabold text-slate-800">
                        {isTh ? 'ถ่ายภาพป้ายทะเบียนรถ หรือเลือกไฟล์จากอุปกรณ์' : 'Take a photo of license plate or choose file'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {isTh
                          ? 'ควรถ่ายให้เห็นป้ายทะเบียนชัดเจน ทั้งหมวดอักษร ตัวเลข และจังหวัด ไม่มืดหรือเบลอ'
                          : 'Ensure letters, numbers, and province are clearly legible'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{isTh ? 'เปิดกล้องถ่ายภาพ' : 'Open Camera'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{isTh ? 'เลือกไฟล์จากเครื่อง' : 'Browse Gallery'}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {uploadError && (
              <div className="text-[11px] font-bold text-red-600 flex items-center gap-1.5 pt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || uploadingImage || !carImageUrl}
            className="w-full py-4 travel-btn-primary font-black text-sm disabled:opacity-50 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{isTh ? 'กำลังบันทึกและส่งข้อมูล...' : 'Saving & Submitting...'}</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>{isTh ? 'ส่งข้อมูลลงทะเบียนและภาพป้ายทะเบียนให้แอดมิน' : 'Submit Car Registration & Plate Photo'}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Car List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
            {isTh ? `รายการรถยนต์ที่คุณลงทะเบียนไว้ (${cars.length} คัน)` : `Your Registered Vehicles (${cars.length})`}
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {isTh ? 'สถานะการตรวจสอบโดยแอดมิน' : 'Admin Verification Status'}
          </span>
        </div>

        {cars.length === 0 ? (
          <div className="travel-card p-8 text-center text-slate-500 text-xs space-y-2 border border-slate-200 shadow-2xs">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="font-bold text-slate-900 text-sm">{isTh ? 'ยังไม่มีข้อมูลรถยนต์ในระบบ' : 'No vehicles registered yet'}</p>
            <p className="text-xs">
              {isTh ? 'คุณต้องลงทะเบียนรถยนต์และส่งภาพป้ายทะเบียนให้แอดมินตรวจสอบก่อน จึงจะสามารถเปิดทริปคาร์พูลได้' : 'Register a car and submit plate photo for admin review to offer rides.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cars.map((car) => {
              const status = car.verification_status || 'อนุมัติแล้ว'; // fallback for legacy data
              const isApproved = status === 'อนุมัติแล้ว';
              const isPending = status === 'รอดำเนินการ';
              const isRejected = status === 'ปฏิเสธ';

              return (
                <div
                  key={car.license_plate}
                  className={`travel-card p-5 space-y-3.5 border transition-shadow shadow-xs ${
                    isApproved
                      ? 'border-emerald-200 bg-white'
                      : isPending
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-red-200 bg-red-50/20'
                  }`}
                >
                  {/* Card Header: Plate and Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${isApproved ? 'bg-emerald-100 text-emerald-700' : isPending ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        <Car className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-mono text-base font-black text-slate-900 block leading-tight">{car.license_plate}</span>
                        <span className="text-[11px] font-bold text-slate-600">{car.model}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 border shrink-0 ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : isPending
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}
                    >
                      {isApproved && <ShieldCheck className="w-3 h-3 text-emerald-600" />}
                      {isPending && <Clock className="w-3 h-3 text-amber-600" />}
                      {isRejected && <ShieldAlert className="w-3 h-3 text-rose-600" />}
                      <span>{status}</span>
                    </span>
                  </div>

                  {/* Photo & Specs Grid */}
                  <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
                    {/* Plate photo thumbnail */}
                    {car.car_image_url ? (
                      <button
                        type="button"
                        onClick={() => setPreviewModalUrl(car.car_image_url)}
                        className="group relative w-20 h-14 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 shadow-2xs cursor-pointer"
                        title={isTh ? "คลิกดูรูปป้ายทะเบียน" : "View plate photo"}
                      >
                        <img
                          src={car.car_image_url}
                          alt={`ป้ายทะเบียน ${car.license_plate}`}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <Eye className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-20 h-14 rounded-lg border border-slate-200 shrink-0 bg-slate-100 flex flex-col items-center justify-center text-slate-400 text-[9px] gap-0.5 font-bold">
                        <ImageIcon className="w-4 h-4" />
                        <span>ไม่มีรูป</span>
                      </div>
                    )}

                    {/* Vehicle Details */}
                    <div className="flex-1 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>{isTh ? 'ความจุที่นั่ง:' : 'Capacity:'}</span>
                        <span className="font-black text-emerald-700">{car.capacity} {isTh ? 'ที่นั่ง' : 'seats'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>{isTh ? 'ลงทะเบียนเมื่อ:' : 'Registered:'}</span>
                        <span className="text-[11px] font-medium text-slate-500">
                          {car.created_at ? new Date(car.created_at).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status explanation notice */}
                  {isPending && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{isTh ? 'ภาพถ่ายป้ายทะเบียนถูกส่งให้แอดมินแล้ว อยู่ระหว่างตรวจสอบเพื่อความปลอดภัย' : 'Photo submitted to admin. Awaiting verification for passenger safety.'}</span>
                    </div>
                  )}

                  {isRejected && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-[11px] space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-rose-800">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{isTh ? 'ไม่ผ่านการอนุมัติจากแอดมิน' : 'Rejected by Admin'}</span>
                      </div>
                      <p className="text-rose-700 pl-5">
                        {car.admin_reply || (isTh ? 'รูปถ่ายป้ายทะเบียนไม่ชัดเจนหรือไม่ถูกต้องตามเกณฑ์' : 'Plate photo unclear or invalid')}
                      </p>
                    </div>
                  )}

                  {isApproved && (
                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{isTh ? 'พร้อมใช้งานสำหรับสร้างทริปเดินทาง' : 'Ready to create carpool trips'}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    {car.car_image_url ? (
                      <button
                        type="button"
                        onClick={() => setPreviewModalUrl(car.car_image_url)}
                        className="text-[11px] font-bold text-slate-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isTh ? 'ดูภาพป้ายทะเบียน' : 'View Plate Photo'}</span>
                      </button>
                    ) : <span />}

                    <button
                      onClick={() => handleDeleteCar(car.license_plate)}
                      className="px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isTh ? 'ลบข้อมูลรถ' : 'Delete Vehicle'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* License Plate Full Image Modal */}
      {previewModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div
            className="relative max-w-2xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between p-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-600" />
                {isTh ? 'รูปถ่ายป้ายทะเบียนรถยนต์สำหรับตรวจสอบ' : 'Vehicle License Plate Photo for Review'}
              </span>
              <button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 overflow-auto max-h-[75vh] flex items-center justify-center">
              <img
                src={previewModalUrl}
                alt="รูปถ่ายป้ายทะเบียนขนาดเต็ม"
                loading="lazy"
                decoding="async"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
