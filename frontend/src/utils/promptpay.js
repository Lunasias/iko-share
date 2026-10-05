/**
 * Standard Thai EMVCo PromptPay QR Code Generator
 * Conforms to Bank of Thailand (BOT) QR Payment specifications.
 */

function crc16(data) {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Generate standard BOT EMVCo PromptPay Payload string
 * @param {string} phoneOrId - Driver phone number (10 digits) or National ID (13 digits)
 * @param {number|string} amount - Amount in THB (optional, dynamic amount)
 * @returns {string} EMVCo PromptPay Payload
 */
export function generatePromptPayPayload(phoneOrId, amount) {
  if (!phoneOrId) return '';
  const cleaned = String(phoneOrId).replace(/[^0-9]/g, '');

  let targetTag = '01';
  let targetVal = '';

  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    targetVal = '0066' + cleaned.substring(1);
    targetTag = '01';
  } else if (cleaned.length === 13) {
    targetVal = cleaned;
    targetTag = '02';
  } else {
    targetVal = '0066' + cleaned.replace(/^0+/, '');
  }

  const tagTarget = targetTag + String(targetVal.length).padStart(2, '0') + targetVal;
  const merchantInfo = '0014A0000067700110' + tagTarget;
  const tag29 = '29' + String(merchantInfo.length).padStart(2, '0') + merchantInfo;

  let payload = '000201010212' + tag29 + '5303764';

  const numAmount = parseFloat(amount);
  if (!isNaN(numAmount) && numAmount > 0) {
    const amtStr = numAmount.toFixed(2);
    payload += '54' + String(amtStr.length).padStart(2, '0') + amtStr;
  }

  payload += '5802TH6304';
  return payload + crc16(payload);
}

/**
 * Get direct QR code image URL for PromptPay
 */
export function getPromptPayQrUrl(phoneOrId, amount, size = 300) {
  const payload = generatePromptPayPayload(phoneOrId, amount);
  if (!payload) return null;
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(payload)}&margin=12&format=png`;
}

/**
 * Format phone number into readable Thai format: 081-234-5678
 */
export function formatPhoneNumber(phone) {
  if (!phone) return '-';
  const cleaned = String(phone).replace(/[^0-9]/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 9) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
  }
  return phone;
}
