import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Dashboard from "./pages/dashboard";
import Notebook from "./pages/notebook";
import StudyPlan from "./pages/studyplan";
import AIAssistant from "./pages/AIAssistant";
import Settings from "./pages/Settings";
import Sidebar from "./components/Sidebar";

function App() {
  const [message, setMessage] = useState("");

  // Fetch backend API message and log it in the console
  useEffect(() => {
    fetch("http://localhost:5000")
      .then((res) => res.text())
      .then((data) => {
        console.log("Backend Message:", data);
        setMessage(data);
      })
      .catch(() => console.error("Error fetching API"));
  }, []);

  // Handle theme persistence
  useEffect(() => {
    const theme = localStorage.getItem("theme") || "light"; // Default to light mode
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 p-6">
        {/* Page Routing */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/notebook" element={<Notebook />} />
          <Route path="/study-plan" element={<StudyPlan />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
