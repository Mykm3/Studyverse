import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Clock, Calendar, ChevronRight, BarChart2, AlertCircle } from "lucide-react"
import { Link } from "react-router-dom"
import { useState, useEffect } from "react"

export default function UpcomingStudySessions({ animate = false }) {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        // Fetch sessions from API
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

        let data = await response.json();
        
        // Filter for upcoming sessions only and sort by date
        const now = new Date();
        data = data
          .filter(session => new Date(session.startTime) > now)
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
          .slice(0, 3); // Only take the next 3 sessions
        
        setSessions(data);
      } catch (err) {
        console.error("Error fetching sessions:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Function to format time from a date string (e.g., "2:00 PM - 3:30 PM")
  const formatTimeRange = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Function to format date (e.g., "Today", "Tomorrow", or "Mar 18")
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Function to calculate duration in minutes
  const calculateDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end - start) / (1000 * 60));
  };

  // Function to get priority color
  const getPriorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
      case 'medium':
        return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400";
      case 'low':
        return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
    }
  };

  // Create some demo sessions if no sessions from API or for development
  const demoSessions = [
    {
      id: 1,
      title: "Calculus II",
      subject: "Practice Problems - High Priority",
      startTime: new Date(new Date().setHours(14, 0, 0, 0)),
      endTime: new Date(new Date().setHours(15, 30, 0, 0)),
      priority: "High",
    },
    {
      id: 2,
      title: "Data Structures",
      subject: "Binary Trees & Traversal",
      startTime: new Date(new Date().setHours(11, 30, 0, 0)),
      endTime: new Date(new Date().setHours(12, 30, 0, 0)),
      priority: "Medium",
    },
    {
      id: 3,
      title: "Physics",
      subject: "Review Session",
      startTime: new Date(new Date().setHours(16, 0, 0, 0)),
      endTime: new Date(new Date().setHours(16, 45, 0, 0)),
      priority: "Low",
    },
  ];

  const displaySessions = sessions.length > 0 ? sessions : demoSessions;

  return (
    <Card className="h-full hover-lift">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-primary" />
          Upcoming Sessions
        </CardTitle>
        <Link to="/analytics">
          <Button size="sm" variant="ghost">
            <BarChart2 className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-6">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <AlertCircle className="h-5 w-5 mx-auto mb-2 text-destructive" />
            <p className="text-sm text-destructive">Failed to load sessions</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displaySessions.map((session) => (
              <div 
                key={session.id}
                className="p-2 border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-sm">{session.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{session.subject}</p>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {calculateDuration(session.startTime, session.endTime)} min
                      </span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full ${getPriorityStyle(session.priority)}`}
                      >
                        {session.priority || "Normal"}
                      </span>
                    </div>
                  </div>
                  <Link to={`/studyplan?session=${session.id}`}>
                    <Button size="icon" variant="ghost" className="h-5 w-5">
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
                <div className="mt-1 flex items-center space-x-3">
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="mr-1 h-3 w-3" />
                    {formatDate(session.startTime)}
                  </div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="mr-1 h-3 w-3" />
                    {formatTimeRange(session.startTime, session.endTime)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

