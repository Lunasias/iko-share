import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const translations = {
  th: {
    findTrips: 'ค้นหาเที่ยวรถ', createTrip: 'เปิดทริปใหม่', myTrips: 'การเดินทาง', profile: 'โปรไฟล์',
    login: 'เข้าสู่ระบบ', register: 'ลงทะเบียน', search: 'ค้นหาทริป',
    badge: 'แพลตฟอร์มคาร์พูลท่องเที่ยวแชร์มิตรภาพอันดับ 1 ในไทย',
    headline: 'เดินทางประหยัด เป็นมิตร สนุกทุกเส้นทาง', headlineEnd: 'ไปทางเดียวกัน ติดรถไปกับ',
    description: 'หารค่าเดินทางอย่างยุติธรรม ชวนเพื่อนร่วมทางไปเที่ยวงานเทศกาล คอนเสิร์ต หรือท่องเที่ยวทั่วไทย',
    origin: 'ต้นทาง (เช่น กรุงเทพฯ)', destination: 'ปลายทาง (เช่น เขาใหญ่, เชียงใหม่)',
    daylight: 'กลางวัน', night: 'กลางคืน', english: 'English', thai: 'ภาษาไทย',
  },
  en: {
    findTrips: 'Find trips', createTrip: 'Create a trip', myTrips: 'My trips', profile: 'Profile',
    login: 'Log in', register: 'Register', search: 'Search trips',
    badge: 'Thailand’s thoughtful carpool community',
    headline: 'Travel further. Share the journey.', headlineEnd: 'Go together with',
    description: 'Share travel costs fairly and meet companions for festivals, concerts, and journeys across Thailand.',
    origin: 'From (e.g. Bangkok)', destination: 'To (e.g. Khao Yai, Chiang Mai)',
    daylight: 'Daylight', night: 'Night', english: 'English', thai: 'ภาษาไทย',
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('iko_theme') || 'light');
  const [language, setLanguage] = useState(() => localStorage.getItem('iko_language') || 'th');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('iko_theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('iko_language', language);
  }, [language]);

  const value = useMemo(() => ({
    theme,
    language,
    isDark: theme === 'dark',
    toggleTheme: () => setTheme((current) => current === 'light' ? 'dark' : 'light'),
    toggleLanguage: () => setLanguage((current) => current === 'th' ? 'en' : 'th'),
    t: (key) => translations[language][key] || translations.th[key] || key,
    setTheme,
    setLanguage,
  }), [theme, language]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
