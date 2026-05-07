/**
 * settingsStore — backed by Django REST API.
 * GET /api/settings/   → all roles
 * PUT /api/settings/   → admin only
 */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiGet, apiPatch } from "../api/client";

const DEFAULT_SETTINGS = {
  universityName: "Wollo University",
  campusName: "Kombolcha Campus",
  academicYear: "2025/2026",
  currentSemester: "Between Semesters",
  address: "Kombolcha, Amhara Region, Ethiopia",
  phone: "+251 33 551 0000",
  email: "info@wu.edu.et",
  website: "www.wu.edu.et",
  semesters: [],
};

// Map API snake_case → legacy camelCase used by components
function normalise(data) {
  return {
    universityName:  data.university_name  ?? data.universityName  ?? DEFAULT_SETTINGS.universityName,
    campusName:      data.campus_name      ?? data.campusName      ?? DEFAULT_SETTINGS.campusName,
    academicYear:    data.academic_year    ?? data.academicYear    ?? DEFAULT_SETTINGS.academicYear,
    currentSemester: data.current_semester ?? data.currentSemester ?? DEFAULT_SETTINGS.currentSemester,
    address:         data.address          ?? DEFAULT_SETTINGS.address,
    phone:           data.phone            ?? DEFAULT_SETTINGS.phone,
    email:           data.email            ?? DEFAULT_SETTINGS.email,
    website:         data.website          ?? DEFAULT_SETTINGS.website,
    semesters:       data.semesters        ?? DEFAULT_SETTINGS.semesters,
  };
}

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettingsState] = useState(DEFAULT_SETTINGS);

  // Load from API on mount (works for all roles — GET is public)
  useEffect(() => {
    apiGet("/settings/")
      .then((data) => { if (data) setSettingsState(normalise(data)); })
      .catch(() => {});
  }, []);

  /**
   * updateSettings — PATCH the API and update local state.
   * Accepts camelCase keys (legacy) or snake_case keys.
   */
  const updateSettings = useCallback(async (patch) => {
    // Convert camelCase → snake_case for the API
    const apiPatch_ = {};
    if (patch.universityName  !== undefined) apiPatch_.university_name  = patch.universityName;
    if (patch.campusName      !== undefined) apiPatch_.campus_name      = patch.campusName;
    if (patch.academicYear    !== undefined) apiPatch_.academic_year    = patch.academicYear;
    if (patch.currentSemester !== undefined) apiPatch_.current_semester = patch.currentSemester;
    if (patch.address         !== undefined) apiPatch_.address          = patch.address;
    if (patch.phone           !== undefined) apiPatch_.phone            = patch.phone;
    if (patch.email           !== undefined) apiPatch_.email            = patch.email;
    if (patch.website         !== undefined) apiPatch_.website          = patch.website;

    try {
      const data = await apiPatch("/settings/", apiPatch_);
      if (data) setSettingsState(normalise(data));
    } catch {
      // Optimistic update even if API fails
      setSettingsState((prev) => ({ ...prev, ...patch }));
    }
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
