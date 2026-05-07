import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { ResultsProvider } from "./data/resultsStore.jsx";
import { AnnouncementsProvider } from "./data/announcementsStore.jsx";
import { AdminProvider } from "./data/adminStore.jsx";
import { SettingsProvider } from "./data/settingsStore.jsx";
import { AddDropProvider } from "./data/addDropStore.jsx";
import { StudentsProvider } from "./data/studentsStore.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AdminProvider>
        <SettingsProvider>
          <ResultsProvider>
            <AnnouncementsProvider>
              <AddDropProvider>
                <StudentsProvider>
                  <App />
                </StudentsProvider>
              </AddDropProvider>
            </AnnouncementsProvider>
          </ResultsProvider>
        </SettingsProvider>
      </AdminProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
