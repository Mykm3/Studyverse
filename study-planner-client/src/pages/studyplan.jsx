import { useState, useEffect } from "react";
import { Button } from "../components/ui/Button"
import { CalendarIcon, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import StudyCalendar from "../components/StudyCalendar"
import UpcomingSessions from "../components/UpcomingSessions"
import Calendar from "../components/Calendar";
import NotificationDashboard from "../components/NotificationDashboard";
import { showToast } from "../lib/toast";

export default function StudyPlanPage() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/study-sessions`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }

      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      showToast({
        title: "Error",
        description: "Failed to fetch study sessions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div
      className="h-screen"
      style={{ backgroundColor: "var(--background-color)", color: "var(--foreground-color)" }}
    >
      <main className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <CalendarIcon className="mr-2 h-6 w-6 text-primary" />
              Study Plan
            </h1>
            <p className="text-gray-500 dark:text-gray-400">Schedule and manage your study sessions</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Study Session
          </Button>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="outline" size="icon" className="mr-2">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-medium">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
            <Button variant="outline" size="icon" className="ml-2">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Today
            </Button>
            <Button variant="outline" size="sm">
              Week
            </Button>
            <Button variant="outline" size="sm" className="bg-primary/10">
              Month
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Calendar sessions={sessions} onSessionUpdate={fetchSessions} />
          </div>
          <div>
            <NotificationDashboard sessions={sessions} />
          </div>
        </div>
      </main>
    </div>
  )
}
