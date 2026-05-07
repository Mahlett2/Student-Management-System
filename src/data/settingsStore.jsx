import { createContext, useContext, useState, useEffect } from "react";

const DEFAULT_SETTINGS = {
  universityName: "Wollo University",
  campusName: "Kombolcha Campus",
  academicYear: "2024/2025",
  currentSemester: "Semester 1",
  address: "Kombolcha, Amhara Region, Ethiopia",
  phone: "+251 33 551 xxxx",
  email: "info@wu.edu.et",
  website: "www.wu.edu.et",
  semesters: [
    { id: 1, name: "Semester 1", startDate: "2024-09-01", endDate: "2025-01-31", status: "Active" },
    { id: 2, name: "Semester 2", startDate: "2025-02-01", endDate: "2025-06-30", status: "Upcoming" },
  ],
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const s = localStorage.getItem("university_settings");
    return s ? JSON.parse(s) : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem("university_settings", JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (patch) => setSettings((p) => ({ ...p, ...patch }));

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
