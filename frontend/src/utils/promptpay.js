/**
 * Standard Thai EMVCo PromptPay QR Code Generator
 * Conforms 100% to Bank of Thailand (BOT) EMVCo QR Payment specifications.
 * Compatible with all Thai Mobile Banking Applications (K PLUS, SCB EASY, Krungthai NEXT, Bualuang m, KMA, etc.)
 */

/**
 * Standard CRC-16/CCITT-FALSE (XMODEM)
 * Initial Value: 0xFFFF, Polynomial: 0x1021, No reflection, Final XOR: 0x0000
 */
function crc16xmodem(str, previous = 0xffff) {
  let crc = previous;
  for (let index = 0; index < str.length; index++) {
    const byte = str.charCodeAt(index);
    let code = (crc >>> 8) & 0xff;
    code ^= byte & 0xff;
    code ^= code >>> 4;
    crc = (crc << 8) & 0xffff;
    crc ^= code;
    code = (code << 5) & 0xffff;
    crc ^= code;
    code = (code << 7) & 0xffff;
    crc ^= code;
  }
  return crc;
}

function f(id, value) {
  return [id, ('00' + value.length).slice(-2), value].join('');
}

function serialize(xs) {
  return xs.filter(Boolean).join('');
}

function sanitizeTarget(id) {
  return String(id || '').replace(/[^0-9]/g, '');
}

function formatTarget(id) {
  const numbers = sanitizeTarget(id);
  if (numbers.length >= 13) return numbers;
  return ('0000000000000' + numbers.replace(/^0/, '66')).slice(-13);
}

function formatAmount(amount) {
  return parseFloat(amount).toFixed(2);
}

function formatCrc(crcValue) {
  return ('0000' + crcValue.toString(16).toUpperCase()).slice(-4);
}

/**
 * Generate standard BOT EMVCo PromptPay Payload string
 * @param {string} phoneOrId - Driver phone number (10 digits), National ID (13 digits), or e-Wallet ID (15 digits)
 * @param {number|string} amount - Amount in THB (optional, dynamic amount)
 * @returns {string} EMVCo PromptPay Payload
 */
export function generatePromptPayPayload(phoneOrId, amount) {
  const target = sanitizeTarget(phoneOrId);
  if (!target) return '';

  const numAmount = parseFloat(amount);
  const hasAmount = !isNaN(numAmount) && numAmount > 0;

  const targetType = target.length >= 15 ? '03' : target.length >= 13 ? '02' : '01';

  const data = [
    f('00', '01'),
    f('01', hasAmount ? '12' : '11'),
    f('29', serialize([
      f('00', 'A000000677010111'),
      f(targetType, formatTarget(target))
    ])),
    f('58', 'TH'),
    f('53', '764'),
    hasAmount && f('54', formatAmount(numAmount))
  ];

  const dataToCrc = serialize(data) + '6304';
  const crc = crc16xmodem(dataToCrc, 0xffff);
  data.push(f('63', formatCrc(crc)));

  return serialize(data);
}

/**
 * Get direct QR code image URL for PromptPay
 * Uses standard error correction level 'M' (15%) and quiet zone margin 4
 */
export function getPromptPayQrUrl(phoneOrId, amount, size = 300) {
  const payload = generatePromptPayPayload(phoneOrId, amount);
  if (!payload) return null;
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(payload)}&ecc=M&margin=4&format=png`;
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
