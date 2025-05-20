import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Clock, Calendar, Edit, Trash } from "lucide-react";

export default function UpcomingSessions({ sessions = [] }) {
  // Use provided sessions, or fall back to sample data if empty
  const displaySessions = sessions.length > 0 
    ? sessions.map(session => ({
        id: session.id || Math.random().toString(36).substring(7),
        title: session.title || "Study Session",
        date: session.startTime 
          ? formatSessionDate(new Date(session.startTime)) 
          : "Upcoming",
        time: session.startTime 
          ? formatSessionTime(new Date(session.startTime), session.duration) 
          : "TBD",
        topic: session.subject || "General",
      }))
    : [
        {
          id: 1,
          title: "React Hooks Deep Dive",
          date: "Today",
          time: "3:00 PM - 4:30 PM",
          topic: "React",
        },
        {
          id: 2,
          title: "CSS Grid Layout",
          date: "Tomorrow",
          time: "10:00 AM - 11:30 AM",
          topic: "CSS",
        },
        {
          id: 3,
          title: "JavaScript Promises",
          date: "Mar 18",
          time: "2:00 PM - 3:30 PM",
          topic: "JavaScript",
        },
      ];

  // Helper function to format date
  function formatSessionDate(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const sessionDate = new Date(date);
    sessionDate.setHours(0, 0, 0, 0);
    
    if (sessionDate.getTime() === today.getTime()) {
      return "Today";
    } else if (sessionDate.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  // Helper function to format time
  function formatSessionTime(date, duration = 60) {
    const startTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const endTime = new Date(date.getTime() + duration * 60000);
    const formattedEndTime = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return `${startTime} - ${formattedEndTime}`;
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displaySessions.map((session) => (
            <div
              key={session.id}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-colors"
            >
              <div className="flex justify-between">
                <h3 className="font-medium text-sm">{session.title}</h3>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive">
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="mt-1 flex items-center space-x-3">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="mr-1 h-3 w-3" />
                  {session.date}
                </div>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="mr-1 h-3 w-3" />
                  {session.time}
                </div>
                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{session.topic}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

