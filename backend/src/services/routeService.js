// Route and Distance Estimation Service
// Supports Google Maps Routes API, OpenStreetMap Online Geocoding, and Full Thailand Regional Database

const https = require('https');

// Memory cache for online geocoded locations
const geocodeCache = new Map();

// Comprehensive coordinates table for all 77 provinces, major districts, universities, and travel hubs across Thailand (with emphasis on the Southern region)
const THAI_COORDINATES = {
  // === ภาคใต้: จังหวัดชุมพร และอำเภอ/สถานที่สำคัญ (KMITL Chumphon Campus Area) ===
  'สจล.ชุมพร': { lat: 10.7229, lng: 99.3789 },
  'สจลชุมพร': { lat: 10.7229, lng: 99.3789 },
  'kmitl chumphon': { lat: 10.7229, lng: 99.3789 },
  'วิทยาเขตชุมพร': { lat: 10.7229, lng: 99.3789 },
  'สจล.': { lat: 10.7229, lng: 99.3789 },
  'สจล': { lat: 10.7229, lng: 99.3789 },
  'kmitl': { lat: 10.7229, lng: 99.3789 },
  'สถานีรถไฟปะทิว': { lat: 10.7447, lng: 99.3175 },
  'ตลาดปะทิว': { lat: 10.7447, lng: 99.3175 },
  'ปะทิว': { lat: 10.7447, lng: 99.3175 },
  'pathiu': { lat: 10.7447, lng: 99.3175 },
  'สนามบินชุมพร': { lat: 10.7128, lng: 99.3622 },
  'ท่าอากาศยานชุมพร': { lat: 10.7128, lng: 99.3622 },
  'หาดทุ่งวัวแล่น': { lat: 10.5645, lng: 99.2748 },
  'สะพลี': { lat: 10.5840, lng: 99.2600 },
  'หาดทรายรี': { lat: 10.3995, lng: 99.2818 },
  'ศาลกรมหลวงชุมพร': { lat: 10.3995, lng: 99.2818 },
  'สถานีรถไฟชุมพร': { lat: 10.4990, lng: 99.1800 },
  'บขส.ชุมพร': { lat: 10.4680, lng: 99.1380 },
  'เมืองชุมพร': { lat: 10.4930, lng: 99.1800 },
  'ชุมพร': { lat: 10.4930, lng: 99.1800 },
  'chumphon': { lat: 10.4930, lng: 99.1800 },
  'ท่าแซะ': { lat: 10.6725, lng: 99.1819 },
  'สวี': { lat: 10.2458, lng: 99.0931 },
  'ทุ่งตะโก': { lat: 10.1167, lng: 99.0833 },
  'หลังสวน': { lat: 9.9486, lng: 99.0768 },
  'ละแม': { lat: 9.7719, lng: 99.0984 },
  'พะโต๊ะ': { lat: 9.7919, lng: 98.7847 },

  // === ภาคใต้: สุราษฎร์ธานี & เกาะสำคัญ ===
  'สุราษฎร์ธานี': { lat: 9.1382, lng: 99.3215 },
  'surat thani': { lat: 9.1382, lng: 99.3215 },
  'สุราษฎร์': { lat: 9.1382, lng: 99.3215 },
  'เซ็นทรัลสุราษฎร์': { lat: 9.1120, lng: 99.3080 },
  'เซ็นทรัลสุราษฎร์ธานี': { lat: 9.1120, lng: 99.3080 },
  'เซ็นทรัลพลาซ่าสุราษฎร์ธานี': { lat: 9.1120, lng: 99.3080 },
  'สนามบินสุราษฎร์ธานี': { lat: 9.1326, lng: 99.1417 },
  'สถานีรถไฟสุราษฎร์ธานี': { lat: 9.1066, lng: 99.2312 },
  'พุนพิน': { lat: 9.1066, lng: 99.2312 },
  'ท่าเรือดอนสัก': { lat: 9.3292, lng: 99.7450 },
  'ดอนสัก': { lat: 9.3175, lng: 99.6917 },
  'เกาะสมุย': { lat: 9.5357, lng: 100.0605 },
  'สมุย': { lat: 9.5357, lng: 100.0605 },
  'samui': { lat: 9.5357, lng: 100.0605 },
  'เกาะพะงัน': { lat: 9.7319, lng: 100.0136 },
  'พะงัน': { lat: 9.7319, lng: 100.0136 },
  'เกาะเต่า': { lat: 10.0922, lng: 99.8395 },
  'เกาะนางยวน': { lat: 10.1200, lng: 99.8150 },
  'เขาสก': { lat: 8.9130, lng: 98.5300 },
  'เขื่อนเชี่ยวหลาน': { lat: 8.9740, lng: 98.8180 },
  'กาญจนดิษฐ์': { lat: 9.1667, lng: 99.4667 },
  'ไชยา': { lat: 9.3833, lng: 99.2000 },
  'ท่าฉาง': { lat: 9.2667, lng: 99.1833 },
  'เวียงสระ': { lat: 8.6333, lng: 99.3500 },
  'พระแสง': { lat: 8.5500, lng: 99.2500 },
  'ม.อ.สุราษฎร์ธานี': { lat: 9.0980, lng: 99.3500 },
  'มรภ.สุราษฎร์ธานี': { lat: 9.0833, lng: 99.3500 },
  'วค.สุราษฎร์ธานี': { lat: 9.0833, lng: 99.3500 },
  'วค.สุราษฎร์': { lat: 9.0833, lng: 99.3500 },

  // === ภาคใต้: นครศรีธรรมราช ===
  'นครศรีธรรมราช': { lat: 8.4304, lng: 99.9631 },
  'nakhon si thammarat': { lat: 8.4304, lng: 99.9631 },
  'นครศรี': { lat: 8.4304, lng: 99.9631 },
  'ม.วลัยลักษณ์': { lat: 8.6445, lng: 99.8975 },
  'มหาวิทยาลัยวลัยลักษณ์': { lat: 8.6445, lng: 99.8975 },
  'ท่าศาลา': { lat: 8.6667, lng: 99.9333 },
  'ทุ่งสง': { lat: 8.1644, lng: 99.6800 },
  'สิชล': { lat: 9.0000, lng: 99.9000 },
  'ขนอม': { lat: 9.2000, lng: 99.8667 },
  'ลานสกา': { lat: 8.3500, lng: 99.7833 },
  'คีรีวง': { lat: 8.4333, lng: 99.7833 },
  'ปากพนัง': { lat: 8.3500, lng: 100.2000 },
  'สนามบินนครศรีธรรมราช': { lat: 8.5397, lng: 99.9447 },
  'วัดเจดีย์': { lat: 8.9167, lng: 99.8667 },
  'ไอ้ไข่': { lat: 8.9167, lng: 99.8667 },

  // === ภาคใต้: สงขลา & หาดใหญ่ ===
  'หาดใหญ่': { lat: 7.0087, lng: 100.4747 },
  'hat yai': { lat: 7.0087, lng: 100.4747 },
  'สงขลา': { lat: 7.1988, lng: 100.5954 },
  'songkhla': { lat: 7.1988, lng: 100.5954 },
  'ม.อ.หาดใหญ่': { lat: 7.0086, lng: 100.4983 },
  'มหาวิทยาลัยสงขลานครินทร์': { lat: 7.0086, lng: 100.4983 },
  'ม.อ.': { lat: 7.0086, lng: 100.4983 },
  'สนามบินหาดใหญ่': { lat: 6.9331, lng: 100.3929 },
  'สถานีรถไฟหาดใหญ่': { lat: 7.0036, lng: 100.4682 },
  'เซ็นทรัลหาดใหญ่': { lat: 6.9922, lng: 100.4855 },
  'สะเดา': { lat: 6.6397, lng: 100.4244 },
  'ด่านนอก': { lat: 6.5244, lng: 100.4189 },
  'ม.ทักษิณ': { lat: 7.1644, lng: 100.6075 },

  // === ภาคใต้: ภูเก็ต ===
  'ภูเก็ต': { lat: 7.8804, lng: 98.3923 },
  'phuket': { lat: 7.8804, lng: 98.3923 },
  'ป่าตอง': { lat: 7.8956, lng: 98.2978 },
  'patong': { lat: 7.8956, lng: 98.2978 },
  'กะรน': { lat: 7.8480, lng: 98.2970 },
  'กะตะ': { lat: 7.8200, lng: 98.3000 },
  'สนามบินภูเก็ต': { lat: 8.1132, lng: 98.3065 },
  'แหลมพรหมเทพ': { lat: 7.7640, lng: 98.3050 },
  'ถลาง': { lat: 8.0300, lng: 98.3300 },
  'กะทู้': { lat: 7.9170, lng: 98.3330 },

  // === ภาคใต้: กระบี่ ===
  'กระบี่': { lat: 8.0863, lng: 98.9063 },
  'krabi': { lat: 8.0863, lng: 98.9063 },
  'อ่าวนาง': { lat: 8.0333, lng: 98.8167 },
  'ไร่เลย์': { lat: 8.0100, lng: 98.8400 },
  'เกาะพีพี': { lat: 7.7407, lng: 98.7784 },
  'เกาะลันตา': { lat: 7.6500, lng: 99.0333 },
  'สนามบินกระบี่': { lat: 8.0989, lng: 98.9864 },
  'คลองท่อม': { lat: 7.9333, lng: 99.1500 },

  // === ภาคใต้: พังงา ===
  'พังงา': { lat: 8.4509, lng: 98.5255 },
  'phang nga': { lat: 8.4509, lng: 98.5255 },
  'เขาหลัก': { lat: 8.6500, lng: 98.2500 },
  'ตะกั่วป่า': { lat: 8.8833, lng: 98.3667 },
  'ท้ายเหมือง': { lat: 8.4000, lng: 98.2667 },

  // === ภาคใต้: ระนอง ===
  'ระนอง': { lat: 9.9658, lng: 98.6348 },
  'ranong': { lat: 9.9658, lng: 98.6348 },
  'เกาะพยาม': { lat: 9.7333, lng: 98.4000 },
  'กะเปอร์': { lat: 9.5833, lng: 98.6000 },
  'สุขสำราญ': { lat: 9.3500, lng: 98.4500 },
  'ละอุ่น': { lat: 10.1500, lng: 98.7500 },

  // === ภาคใต้: ตรัง ===
  'ตรัง': { lat: 7.5563, lng: 99.6114 },
  'trang': { lat: 7.5563, lng: 99.6114 },
  'กันตัง': { lat: 7.4100, lng: 99.5150 },
  'ห้วยยอด': { lat: 7.7880, lng: 99.6380 },
  'ปากเมง': { lat: 7.5000, lng: 99.3200 },
  'สนามบินตรัง': { lat: 7.5089, lng: 99.6161 },

  // === ภาคใต้: พัทลุง ===
  'พัทลุง': { lat: 7.6167, lng: 100.0833 },
  'phatthalung': { lat: 7.6167, lng: 100.0833 },
  'ควนขนุน': { lat: 7.7333, lng: 100.0100 },
  'ทะเลน้อย': { lat: 7.7800, lng: 100.1200 },

  // === ภาคใต้: สตูล ===
  'สตูล': { lat: 6.6238, lng: 100.0674 },
  'satun': { lat: 6.6238, lng: 100.0674 },
  'ละงู': { lat: 6.8800, lng: 99.7800 },
  'ปากบารา': { lat: 6.8500, lng: 99.7300 },
  'เกาะหลีเป๊ะ': { lat: 6.4880, lng: 99.3030 },

  // === ภาคใต้: ยะลา ปัตตานี นราธิวาส ===
  'ยะลา': { lat: 6.5411, lng: 101.2804 },
  'yala': { lat: 6.5411, lng: 101.2804 },
  'เบตง': { lat: 5.7718, lng: 101.0715 },
  'betong': { lat: 5.7718, lng: 101.0715 },
  'ปัตตานี': { lat: 6.8696, lng: 101.2501 },
  'pattani': { lat: 6.8696, lng: 101.2501 },
  'ม.อ.ปัตตานี': { lat: 6.8845, lng: 101.2280 },
  'นราธิวาส': { lat: 6.4255, lng: 101.8253 },
  'narathiwat': { lat: 6.4255, lng: 101.8253 },
  'สุไหงโก-ลก': { lat: 6.0289, lng: 101.9667 },
  'ตากใบ': { lat: 6.2570, lng: 102.0500 },

  // === กรุงเทพฯ & ปริมณฑล (ศูนย์กลางการคมนาคม) ===
  'กรุงเทพ': { lat: 13.7563, lng: 100.5018 },
  'กทม': { lat: 13.7563, lng: 100.5018 },
  'bangkok': { lat: 13.7563, lng: 100.5018 },
  'หมอชิต': { lat: 13.8037, lng: 100.5534 },
  'สายใต้ใหม่': { lat: 13.7808, lng: 100.4225 },
  'เอกมัย': { lat: 13.7197, lng: 100.5833 },
  'อนุสาวรีย์ชัยฯ': { lat: 13.7649, lng: 100.5383 },
  'อนุสาวรีย์': { lat: 13.7649, lng: 100.5383 },
  'สถานีกลางกรุงเทพอภิวัฒน์': { lat: 13.8030, lng: 100.5400 },
  'บางซื่อ': { lat: 13.8030, lng: 100.5400 },
  'หัวลำโพง': { lat: 13.7380, lng: 100.5167 },
  'สนามบินดอนเมือง': { lat: 13.9126, lng: 100.6067 },
  'ดอนเมือง': { lat: 13.9126, lng: 100.6067 },
  'สนามบินสุวรรณภูมิ': { lat: 13.6900, lng: 100.7501 },
  'สุวรรณภูมิ': { lat: 13.6900, lng: 100.7501 },
  'รังสิต': { lat: 13.9877, lng: 100.6174 },
  'ฟิวเจอร์พาร์ค': { lat: 13.9890, lng: 100.6175 },
  'ลาดกระบัง': { lat: 13.7299, lng: 100.7782 },
  'สจล.ลาดกระบัง': { lat: 13.7299, lng: 100.7782 },
  'สยาม': { lat: 13.7460, lng: 100.5340 },
  'บางนา': { lat: 13.6680, lng: 100.6050 },
  'นนทบุรี': { lat: 13.8591, lng: 100.5217 },
  'ปทุมธานี': { lat: 14.0208, lng: 100.5250 },
  'สมุทรปราการ': { lat: 13.5991, lng: 100.5998 },
  'สมุทรสาคร': { lat: 13.5475, lng: 100.2744 },
  'มหาชัย': { lat: 13.5475, lng: 100.2744 },
  'สมุทรสงคราม': { lat: 13.4098, lng: 99.9998 },
  'อัมพวา': { lat: 13.4250, lng: 99.9550 },
  'นครปฐม': { lat: 13.8196, lng: 100.0601 },
  'ศาลายา': { lat: 13.7930, lng: 100.3230 },
  'ม.มหิดล': { lat: 13.7930, lng: 100.3230 },
  'ม.ธรรมศาสตร์': { lat: 14.0725, lng: 100.6030 },
  'มธ.รังสิต': { lat: 14.0725, lng: 100.6030 },
  'ม.เกษตรศาสตร์': { lat: 13.8475, lng: 100.5700 },
  'จุฬา': { lat: 13.7367, lng: 100.5331 },

  // === ภาคกลาง & ตะวันตก ===
  'เพชรบุรี': { lat: 13.1114, lng: 99.9392 },
  'ชะอำ': { lat: 12.7997, lng: 99.9678 },
  'ประจวบคีรีขันธ์': { lat: 11.8124, lng: 99.7974 },
  'ประจวบ': { lat: 11.8124, lng: 99.7974 },
  'หัวหิน': { lat: 12.5684, lng: 99.9577 },
  'hua hin': { lat: 12.5684, lng: 99.9577 },
  'ปราณบุรี': { lat: 12.3833, lng: 99.9167 },
  'ทับสะแก': { lat: 11.5000, lng: 99.6333 },
  'บางสะพาน': { lat: 11.2000, lng: 99.5000 },
  'ราชบุรี': { lat: 13.5283, lng: 99.8134 },
  'กาญจนบุรี': { lat: 14.0228, lng: 99.5328 },
  'อยุธยา': { lat: 14.3532, lng: 100.5684 },
  'สระบุรี': { lat: 14.5289, lng: 100.9108 },
  'ลพบุรี': { lat: 14.7995, lng: 100.6534 },
  'สุพรรณบุรี': { lat: 14.4745, lng: 100.1177 },
  'อ่างทอง': { lat: 14.5896, lng: 100.4550 },
  'สิงห์บุรี': { lat: 14.8913, lng: 100.4047 },
  'ชัยนาท': { lat: 15.1852, lng: 100.1251 },
  'นครสวรรค์': { lat: 15.6987, lng: 100.1199 },
  'อุทัยธานี': { lat: 15.3835, lng: 100.0245 },

  // === ภาคตะวันออก ===
  'ชลบุรี': { lat: 13.3611, lng: 100.9847 },
  'พัทยา': { lat: 12.9276, lng: 100.8771 },
  'pattaya': { lat: 12.9276, lng: 100.8771 },
  'บางแสน': { lat: 13.2830, lng: 100.9150 },
  'ม.บูรพา': { lat: 13.2830, lng: 100.9250 },
  'ศรีราชา': { lat: 13.1730, lng: 100.9310 },
  'ระยอง': { lat: 12.6815, lng: 101.2816 },
  'เสม็ด': { lat: 12.5600, lng: 101.4500 },
  'จันทบุรี': { lat: 12.6114, lng: 102.1039 },
  'ตราด': { lat: 12.2428, lng: 102.5175 },
  'เกาะช้าง': { lat: 12.0500, lng: 102.3500 },
  'ฉะเชิงเทรา': { lat: 13.6904, lng: 101.0780 },
  'ปราจีนบุรี': { lat: 14.0509, lng: 101.3734 },
  'นครนายก': { lat: 14.2069, lng: 101.2131 },
  'สระแก้ว': { lat: 13.8140, lng: 102.0725 },

  // === ภาคเหนือ ===
  'เชียงใหม่': { lat: 18.7883, lng: 98.9853 },
  'chiang mai': { lat: 18.7883, lng: 98.9853 },
  'ม.เชียงใหม่': { lat: 18.8025, lng: 98.9515 },
  'มช': { lat: 18.8025, lng: 98.9515 },
  'นิมมาน': { lat: 18.7960, lng: 98.9680 },
  'เชียงราย': { lat: 19.9072, lng: 99.8325 },
  'ลำปาง': { lat: 18.2888, lng: 99.4928 },
  'ลำพูน': { lat: 18.5744, lng: 99.0087 },
  'แม่ฮ่องสอน': { lat: 19.3021, lng: 97.9654 },
  'ปาย': { lat: 19.3622, lng: 98.4406 },
  'น่าน': { lat: 18.7756, lng: 100.7730 },
  'พะเยา': { lat: 19.1664, lng: 99.9019 },
  'แพร่': { lat: 18.1446, lng: 100.1410 },
  'อุตรดิตถ์': { lat: 17.6201, lng: 100.0993 },
  'สุโขทัย': { lat: 17.0056, lng: 99.8264 },
  'พิษณุโลก': { lat: 16.8211, lng: 100.2659 },
  'ม.นเรศวร': { lat: 16.7444, lng: 100.1947 },
  'พิจิตร': { lat: 16.4418, lng: 100.3488 },
  'กำแพงเพชร': { lat: 16.4828, lng: 99.5227 },
  'ตาก': { lat: 16.8840, lng: 99.1259 },
  'แม่สอด': { lat: 16.7167, lng: 98.5667 },
  'เพชรบูรณ์': { lat: 16.4190, lng: 101.1574 },
  'เขาค้อ': { lat: 16.6333, lng: 100.9833 },

  // === ภาคตะวันออกเฉียงเหนือ (อีสาน) ===
  'นครราชสีมา': { lat: 14.9799, lng: 102.0978 },
  'โคราช': { lat: 14.9799, lng: 102.0978 },
  'korat': { lat: 14.9799, lng: 102.0978 },
  'ปากช่อง': { lat: 14.7075, lng: 101.4175 },
  'เขาใหญ่': { lat: 14.4392, lng: 101.3723 },
  'khao yai': { lat: 14.4392, lng: 101.3723 },
  'ม.สุรนารี': { lat: 14.8770, lng: 102.0230 },
  'ขอนแก่น': { lat: 16.4322, lng: 102.8236 },
  'khon kaen': { lat: 16.4322, lng: 102.8236 },
  'ม.ขอนแก่น': { lat: 16.4744, lng: 102.8242 },
  'มข': { lat: 16.4744, lng: 102.8242 },
  'อุดรธานี': { lat: 17.4138, lng: 102.7872 },
  'อุบลราชธานี': { lat: 15.2448, lng: 104.8473 },
  'บุรีรัมย์': { lat: 14.9930, lng: 103.1029 },
  'สุรินทร์': { lat: 14.8818, lng: 103.4936 },
  'ศรีสะเกษ': { lat: 15.1186, lng: 104.3220 },
  'ร้อยเอ็ด': { lat: 16.0538, lng: 103.6520 },
  'มหาสารคาม': { lat: 16.1852, lng: 103.3007 },
  'กาฬสินธุ์': { lat: 16.4328, lng: 103.5064 },
  'สกลนคร': { lat: 17.1546, lng: 104.1486 },
  'นครพนม': { lat: 17.3998, lng: 104.7694 },
  'มุกดาหาร': { lat: 16.5434, lng: 104.7235 },
  'ยโสธร': { lat: 15.7926, lng: 104.1451 },
  'อำนาจเจริญ': { lat: 15.8585, lng: 104.6258 },
  'หนองคาย': { lat: 17.8783, lng: 102.7420 },
  'หนองบัวลำภู': { lat: 17.2036, lng: 102.4407 },
  'เลย': { lat: 17.4860, lng: 101.7223 },
  'เชียงคาน': { lat: 17.8950, lng: 101.6550 },
  'บึงกาฬ': { lat: 18.3633, lng: 103.6528 },
  'ชัยภูมิ': { lat: 15.8080, lng: 102.0315 },
};

// Calculate Great Circle Distance in kilometers (Haversine formula)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// In-memory fast dictionary matching
function findCoordinatesInDict(text) {
  if (!text || typeof text !== 'string') return null;
  const cleaned = text.trim().toLowerCase().replace(/[.\s_-]/g, '');

  const keys = Object.keys(THAI_COORDINATES);

  // 1. Exact match (Highest priority)
  for (const key of keys) {
    const cleanKey = key.toLowerCase().replace(/[.\s_-]/g, '');
    if (cleaned === cleanKey) {
      return THAI_COORDINATES[key];
    }
  }

  // 2. User input contains dictionary key (e.g. 'ไปตลาดปะทิว' contains 'ปะทิว')
  // Sort keys by descending length so compound specific names (e.g. 'สจล.ชุมพร') match before generic ('ชุมพร')
  const descKeys = [...keys].sort((a, b) => b.length - a.length);
  for (const key of descKeys) {
    const cleanKey = key.toLowerCase().replace(/[.\s_-]/g, '');
    if (cleaned.includes(cleanKey)) {
      return THAI_COORDINATES[key];
    }
  }

  // 3. Fallback: Dictionary key contains user input (e.g. user typed abbreviation, at least 3 chars)
  // Sort keys by ascending length so shortest match is preferred
  if (cleaned.length >= 3) {
    const ascKeys = [...keys].sort((a, b) => a.length - b.length);
    for (const key of ascKeys) {
      const cleanKey = key.toLowerCase().replace(/[.\s_-]/g, '');
      if (cleanKey.includes(cleaned)) {
        return THAI_COORDINATES[key];
      }
    }
  }

  return null;
}


// Dynamic OpenStreetMap Nominatim Live Geocoder Fallback
function geocodeWithNominatim(query) {
  return new Promise((resolve) => {
    if (!query || typeof query !== 'string') return resolve(null);
    const trimmed = query.trim();
    if (geocodeCache.has(trimmed)) {
      return resolve(geocodeCache.get(trimmed));
    }

    const cleanQuery = trimmed.replace(/[.,]/g, ' ') + ' Thailand';
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&countrycodes=th&limit=1`;

    const req = https.get(url, {
      headers: {
        'User-Agent': 'IkoShareApp-UniversityProject/1.0 (contact: info@ikoshare.com)',
        'Accept-Language': 'th, en',
      },
      timeout: 2500,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (Array.isArray(json) && json.length > 0 && json[0].lat && json[0].lon) {
            const coords = { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) };
            geocodeCache.set(trimmed, coords);
            return resolve(coords);
          }
        } catch {}
        resolve(null);
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

// Smart dual-layer coordinates finder (Dictionary first, then Live Geocoding)
async function findCoordinatesSmart(text) {
  const dictCoords = findCoordinatesInDict(text);
  if (dictCoords) return dictCoords;

  try {
    const liveCoords = await geocodeWithNominatim(text);
    if (liveCoords) return liveCoords;
  } catch {}

  return null;
}

// Format duration into readable Thai text
function formatDurationThai(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  if (hours > 0 && mins > 0) {
    return `${hours} ชม. ${mins} นาที`;
  } else if (hours > 0) {
    return `${hours} ชม.`;
  }
  return `${mins || 10} นาที`;
}

// Query Google Routes API (Modern computeRoutes endpoint)
function fetchGoogleRoutesAPI(origin, destination, apiKey) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      origin: { address: origin },
      destination: { address: destination },
      travelMode: 'DRIVE',
    });

    const options = {
      hostname: 'routes.googleapis.com',
      path: '/directions/v2:computeRoutes',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.routes && json.routes.length > 0 && json.routes[0].distanceMeters) {
            const meters = json.routes[0].distanceMeters;
            const distanceKm = Math.round((meters / 1000) * 10) / 10;
            const durationSec = parseInt(json.routes[0].duration) || 0;
            const durationMinutes = Math.round(durationSec / 60);
            resolve({
              distance_km: distanceKm,
              duration_text: formatDurationThai(durationMinutes),
              duration_minutes: durationMinutes,
              source: 'google_routes_api',
            });
          } else {
            reject(new Error(json.error?.message || 'Routes API returned no routes'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

// Query Google Maps Distance Matrix API (Legacy fallback)
function fetchGoogleMapsDistance(origin, destination, apiKey) {
  return new Promise((resolve, reject) => {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
      origin
    )}&destinations=${encodeURIComponent(destination)}&key=${apiKey}&language=th`;

    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (
              json.status === 'OK' &&
              json.rows?.[0]?.elements?.[0]?.status === 'OK'
            ) {
              const element = json.rows[0].elements[0];
              const distanceKm = Math.round((element.distance.value / 1000) * 10) / 10;
              const durationMinutes = Math.round(element.duration.value / 60);
              const durationText = element.duration.text || formatDurationThai(durationMinutes);
              resolve({
                distance_km: distanceKm,
                duration_text: durationText,
                duration_minutes: durationMinutes,
                source: 'google_maps',
              });
            } else {
              reject(new Error(json.error_message || json.status || 'Google Maps failed'));
            }
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', (err) => reject(err));
  });
}

/**
 * Estimate road distance, duration, and calculate vehicle depreciation breakdown
 */
function calculateOperatingCost(distanceKm, seats = 4) {
  const FUEL_RATE_PER_KM = 2.20;
  const DEPRECIATION_RATE_PER_KM = 1.30;
  const dist = parseFloat(distanceKm) || 0;
  const seatCount = Math.max(1, parseInt(seats) || 4);

  const estimatedFuelCost = Math.round(dist * FUEL_RATE_PER_KM);
  const estimatedDepreciationCost = Math.round(dist * DEPRECIATION_RATE_PER_KM);
  const totalOperatingCost = estimatedFuelCost + estimatedDepreciationCost;
  const recommendedPricePerSeat = Math.max(25, Math.round((totalOperatingCost / seatCount) / 10) * 10);
  const minReasonablePrice = Math.max(20, Math.round(recommendedPricePerSeat * 0.4));

  return {
    fuel_rate_per_km: FUEL_RATE_PER_KM,
    depreciation_rate_per_km: DEPRECIATION_RATE_PER_KM,
    estimated_fuel_cost: estimatedFuelCost,
    estimated_depreciation_cost: estimatedDepreciationCost,
    total_operating_cost: totalOperatingCost,
    recommended_price_per_seat: recommendedPricePerSeat,
    min_reasonable_price: minReasonablePrice,
    // CamelCase aliases
    fuelCost: estimatedFuelCost,
    depreciationCost: estimatedDepreciationCost,
    totalCost: totalOperatingCost,
    recommendedSeatPrice: recommendedPricePerSeat,
    reasonableMinPrice: minReasonablePrice,
  };
}

async function estimateRoute(origin, destination, seats = 4) {
  if (!origin || !destination) {
    throw new Error('กรุณาระบุต้นทางและปลายทาง');
  }

  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
  let routeResult = null;

  // 1. Try Google Routes API if key configured
  if (googleApiKey) {
    try {
      routeResult = await fetchGoogleRoutesAPI(origin, destination, googleApiKey);
    } catch (err) {
      console.warn('Google Routes API error, trying Distance Matrix fallback:', err.message);
      try {
        routeResult = await fetchGoogleMapsDistance(origin, destination, googleApiKey);
      } catch (err2) {
        console.warn('Google Maps API fallback error:', err2.message);
      }
    }
  }

  // 2. Dual-Layer Thai Coordinates Engine (Built-in Dict + Live OSM Geocoding)
  if (!routeResult) {
    const [originCoords, destCoords] = await Promise.all([
      findCoordinatesSmart(origin),
      findCoordinatesSmart(destination),
    ]);

    let distanceKm = 15;
    let durationMinutes = 20;

    if (originCoords && destCoords) {
      const crowDistance = haversineDistance(
        originCoords.lat,
        originCoords.lng,
        destCoords.lat,
        destCoords.lng
      );
      // For short/local trips (<20km), winding factor is ~1.18x; for longer trips ~1.28x
      const windingFactor = crowDistance < 20 ? 1.18 : 1.28;
      distanceKm = Math.max(1, Math.round(crowDistance * windingFactor * 10) / 10);
      // Speed estimate: 45 km/h for local roads, 72 km/h for highways
      const speedKmh = distanceKm < 25 ? 45 : 72;
      durationMinutes = Math.max(5, Math.round((distanceKm / speedKmh) * 60));
    }

    routeResult = {
      distance_km: distanceKm,
      duration_text: formatDurationThai(durationMinutes),
      duration_minutes: durationMinutes,
      source: 'smart_route_engine',
    };
  }

  const distanceKm = routeResult.distance_km;
  const cost = calculateOperatingCost(distanceKm, seats);

  return {
    success: true,
    origin,
    destination,
    distance_km: distanceKm,
    distanceKm: distanceKm,
    duration_text: routeResult.duration_text,
    durationText: routeResult.duration_text,
    duration_minutes: routeResult.duration_minutes,
    cost_breakdown: cost,
    costBreakdown: cost,
    source: routeResult.source,
  };
}

module.exports = {
  estimateRoute,
  calculateOperatingCost,
  formatDurationThai,
  findCoordinatesInDict,
  THAI_COORDINATES,
};
