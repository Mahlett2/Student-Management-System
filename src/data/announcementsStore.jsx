import { createContext, useContext, useState, useEffect } from "react";

const AnnouncementsContext = createContext(null);

export function AnnouncementsProvider({ children }) {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const s = localStorage.getItem("announcements");
    if (s) setAnnouncements(JSON.parse(s));
  }, []);

  useEffect(() => {
    localStorage.setItem("announcements", JSON.stringify(announcements));
  }, [announcements]);

  return (
    <AnnouncementsContext.Provider value={{ announcements, setAnnouncements }}>
      {children}
    </AnnouncementsContext.Provider>
  );
}

export function useAnnouncements() {
  return useContext(AnnouncementsContext);
}
