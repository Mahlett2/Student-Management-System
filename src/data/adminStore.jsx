import { createContext, useContext, useState, useEffect } from "react";

// Default super admin — always exists
const DEFAULT_ADMINS = [
  { id: 1, username: "admin", password: "Admin@123!", fullName: "Super Administrator", email: "admin@university.edu", role: "Super Admin", status: "Active" },
  { id: 2, username: "staff1", password: "Staff@123!", fullName: "Staff Member", email: "staff@university.edu", role: "Staff", status: "Active" },
];

// Bump this version whenever default passwords change — forces a reset
const ADMIN_VERSION = "v2";

function loadAdmins() {
  const version = localStorage.getItem("admin_accounts_version");
  if (version !== ADMIN_VERSION) {
    // Stale data — reset to new defaults
    localStorage.setItem("admin_accounts_version", ADMIN_VERSION);
    localStorage.removeItem("admin_accounts");
    return DEFAULT_ADMINS;
  }
  const s = localStorage.getItem("admin_accounts");
  return s ? JSON.parse(s) : DEFAULT_ADMINS;
}

// Permissions per role
export const ROLE_PERMISSIONS = {
  "Super Admin": ["students", "teachers", "classes", "subjects", "timetable", "results", "attendance", "announcements", "users"],
  "Staff":       ["students", "teachers", "classes", "subjects", "timetable", "results", "attendance", "announcements"],
};

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [admins, setAdmins] = useState(() => loadAdmins());

  const [currentAdmin, setCurrentAdmin] = useState(() => {
    const s = localStorage.getItem("current_admin");
    return s ? JSON.parse(s) : null;
  });

  useEffect(() => { localStorage.setItem("admin_accounts", JSON.stringify(admins)); }, [admins]);
  useEffect(() => { localStorage.setItem("current_admin", currentAdmin ? JSON.stringify(currentAdmin) : ""); }, [currentAdmin]);

  const login = (username, password) => {
    const found = admins.find((a) => a.username === username && a.password === password && a.status === "Active");
    if (found) { setCurrentAdmin(found); return true; }
    return false;
  };

  const logout = () => { setCurrentAdmin(null); localStorage.removeItem("current_admin"); };

  const can = (page) => {
    if (!currentAdmin) return false;
    return (ROLE_PERMISSIONS[currentAdmin.role] || []).includes(page);
  };

  return (
    <AdminContext.Provider value={{ admins, setAdmins, currentAdmin, login, logout, can }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
