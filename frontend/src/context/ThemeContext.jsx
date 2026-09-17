import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const translations = {
  th: {
    findTrips: 'ค้นหาเที่ยวรถ', createTrip: 'เปิดทริปใหม่', myTrips: 'การเดินทาง', profile: 'โปรไฟล์',
    myCars: 'รถของฉัน', admin: 'ระบบแอดมิน', logout: 'ออกจากระบบ',
    login: 'เข้าสู่ระบบ', register: 'ลงทะเบียน', search: 'ค้นหาทริป',
    language: 'English', menu: 'เมนู',
    userProfile: 'โปรไฟล์',
    badge: 'แพลตฟอร์มคาร์พูลท่องเที่ยวแชร์มิตรภาพอันดับ 1 ในไทย',
    headline: 'เดินทางประหยัด เป็นมิตร สนุกทุกเส้นทาง', headlineEnd: 'ไปทางเดียวกัน ติดรถไปกับ',
    description: 'หารค่าเดินทางอย่างยุติธรรม ชวนเพื่อนร่วมทางไปเที่ยวงานเทศกาล คอนเสิร์ต หรือท่องเที่ยวทั่วไทย',
    origin: 'ต้นทาง (เช่น กรุงเทพฯ)', destination: 'ปลายทาง (เช่น เขาใหญ่, เชียงใหม่)',
    english: 'English', thai: 'ภาษาไทย',
    adminLabel: 'ผู้ดูแลระบบ', driverLabel: 'คนขับ', bothLabel: 'คนขับและผู้โดยสาร', passengerLabel: 'ผู้โดยสาร',
    changeLanguage: 'เปลี่ยนภาษา', openMenu: 'เปิดเมนู', closeMenu: 'ปิดเมนู',
    footerCopyright: '© 2026 Iko Share. สงวนลิขสิทธิ์ทุกประการ',
    footerTagline: 'แพลตฟอร์มคาร์พูลสำหรับทุกการเดินทาง', footerTechnology: 'ขับเคลื่อนด้วย Vercel + Neon Postgres',
    featureOneTitle: 'เดินทางคุ้มค่าไปด้วยกัน',
    featureOneDescription: 'แบ่งค่าใช้จ่ายอย่างเป็นธรรม เพื่อให้ทุกการเดินทางสบายกระเป๋าและสนุกยิ่งขึ้น',
    featureTwoTitle: 'เดินทางมั่นใจในทุกเส้นทาง',
    featureTwoDescription: 'ดูโปรไฟล์และรีวิวก่อนออกเดินทาง แล้วเลือกเพื่อนร่วมทางที่เหมาะกับคุณ',
    featureThreeTitle: 'พบเพื่อนใหม่ สร้างเรื่องราวดี ๆ',
    featureThreeDescription: 'เปลี่ยนทุกเส้นทางให้เป็นความทรงจำ และพบผู้คนที่รักการเดินทางเหมือนกัน',
  },
  en: {
    findTrips: 'Find a ride', createTrip: 'Create a trip', myTrips: 'My journeys', profile: 'Profile',
    myCars: 'My vehicles', admin: 'Admin', logout: 'Log out',
    login: 'Log in', register: 'Sign up', search: 'Find a ride',
    language: 'ไทย', menu: 'Menu',
    userProfile: 'Profile',
    badge: 'Thailand’s welcoming carpool community',
    headline: 'Go farther. Spend less.', headlineEnd: 'Share the road with',
    description: 'Split travel costs fairly and find great company for festivals, concerts, weekend escapes, and journeys across Thailand.',
    origin: 'From (for example, Bangkok)', destination: 'To (for example, Khao Yai or Chiang Mai)',
    english: 'English', thai: 'Thai',
    adminLabel: 'Administrator', driverLabel: 'Driver', bothLabel: 'Driver & passenger', passengerLabel: 'Passenger',
    changeLanguage: 'Change language', openMenu: 'Open menu', closeMenu: 'Close menu',
    footerCopyright: '© 2026 Iko Share. All rights reserved.',
    footerTagline: 'A carpool community for every journey', footerTechnology: 'Built with Vercel + Neon Postgres',
    featureOneTitle: 'Make every journey go further',
    featureOneDescription: 'Split costs fairly, travel more often, and keep more in your pocket.',
    featureTwoTitle: 'Travel with confidence',
    featureTwoDescription: 'Review profiles and ratings, then choose companions who fit your travel style.',
    featureThreeTitle: 'Meet people. Make memories.',
    featureThreeDescription: 'Turn every route into a story and connect with people who love exploring too.',
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('iko_language') || 'th');

  useEffect(() => {
    document.documentElement.dataset.theme = 'light';
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('iko_language', language);
  }, [language]);

  const value = useMemo(() => ({
    language,
    toggleLanguage: () => setLanguage((current) => current === 'th' ? 'en' : 'th'),
    t: (key) => translations[language][key] || translations.th[key] || key,
    setLanguage,
  }), [language]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
