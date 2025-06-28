import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { Overview } from "./components/Overview";
import { BannedIPs } from "./components/BannedIPs";
import { Logs } from "./components/Logs";
import { Config } from "./components/Config";

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <Router>
      <div
        className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 ${
          darkMode ? "dark" : ""
        }`}
      >
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
              <Routes>
                <Route path="/" element={<Overview />} />
                <Route path="/banned-ips" element={<BannedIPs />} />
                <Route path="/logs" element={<Logs />} />
                <Route path="/config" element={<Config />} />
              </Routes>
            </main>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
