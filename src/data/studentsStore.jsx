import { createContext, useContext, useState, useEffect } from "react";

const StudentsContext = createContext(null);

export function StudentsProvider({ children }) {
  const [students, setStudents] = useState(() => {
    const s = localStorage.getItem("students_admin");
    return s ? JSON.parse(s) : [];
  });

  useEffect(() => {
    localStorage.setItem("students_admin", JSON.stringify(students));
  }, [students]);

  return (
    <StudentsContext.Provider value={{ students, setStudents }}>
      {children}
    </StudentsContext.Provider>
  );
}

export function useStudents() {
  return useContext(StudentsContext);
}
