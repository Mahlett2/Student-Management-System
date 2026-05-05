import { createContext, useContext, useState, useEffect } from "react";

const AddDropContext = createContext(null);

export function AddDropProvider({ children }) {
  const [requests, setRequests] = useState(() => {
    const s = localStorage.getItem("adddrop_requests");
    return s ? JSON.parse(s) : [];
  });

  useEffect(() => {
    localStorage.setItem("adddrop_requests", JSON.stringify(requests));
  }, [requests]);

  return (
    <AddDropContext.Provider value={{ requests, setRequests }}>
      {children}
    </AddDropContext.Provider>
  );
}

export function useAddDrop() {
  return useContext(AddDropContext);
}
