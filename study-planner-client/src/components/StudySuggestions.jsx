import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Clock, Calendar, ChevronRight } from "lucide-react"
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

  // Function to format time from a date string (e.g., "02:12 PM - 04:06 PM")
  const formatTimeRange = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Function to format date (e.g., "Jun 7")
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Function to calculate duration in minutes
  const calculateDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end - start) / (1000 * 60));
  };

  // Create some demo sessions if no sessions from API or for development
  const demoSessions = [
    {
      id: 1,
      title: "Database",
      subject: "Database",
      startTime: (() => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        date.setHours(14, 0, 0, 0);
        return date;
      })(),
      endTime: (() => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        date.setHours(16, 0, 0, 0);
        return date;
      })(),
      priority: "Normal",
    },
    {
      id: 2,
      title: "System Analysis",
      subject: "System Analysis",
      startTime: (() => {
        const date = new Date();
        date.setDate(date.getDate() + 5);
        date.setHours(8, 12, 0, 0);
        return date;
      })(),
      endTime: (() => {
        const date = new Date();
        date.setDate(date.getDate() + 5);
        date.setHours(10, 12, 0, 0);
        return date;
      })(),
      priority: "Normal",
    },
    {
      id: 3,
      title: "Electronics",
      subject: "Electronics",
      startTime: (() => {
        const date = new Date();
        date.setDate(date.getDate() + 9);
        date.setHours(15, 26, 0, 0);
        return date;
      })(),
      endTime: (() => {
        const date = new Date();
        date.setDate(date.getDate() + 9);
        date.setHours(17, 26, 0, 0);
        return date;
      })(),
      priority: "Normal",
    },
  ];

  // Use real sessions if available, otherwise use demo sessions
  const displaySessions = sessions.length > 0 ? sessions : demoSessions;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-primary" />
          Upcoming Sessions
        </CardTitle>
        <Link to="/study-plan">
          <Button size="sm" variant="ghost">
            <ChevronRight className="h-4 w-4" />
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
            <p className="text-sm text-muted-foreground">Failed to load sessions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displaySessions.map((session) => {
              const duration = calculateDuration(session.startTime, session.endTime);
              const subject = session.subject || session.title;
              const date = formatDate(session.startTime);
              const timeRange = formatTimeRange(session.startTime, session.endTime);
              
              return (
                <Link 
                  key={session.id}
                  to={`/study-plan?session=${session.id}`}
                  className="block border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex flex-col">
                    <h3 className="font-medium">{subject}</h3>
                    <div className="text-sm text-muted-foreground">{duration} min</div>
                    <div className="flex items-center mt-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span className="mr-4">{date}</span>
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{timeRange}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

