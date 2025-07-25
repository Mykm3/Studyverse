import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Bell, Calendar, Clock, Tag } from "lucide-react";
import { Button } from "./ui/Button";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { getSubjectColorMap, generateColorFromString } from "../lib/utils";

// Fallback function in case date-fns fails to load
function formatDateRelative(date) {
  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    // Calculate a simple relative date if date-fns is not available
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const dayDiff = Math.floor(diff / (24 * 60 * 60 * 1000));
    
    if (dayDiff === 0) return "today";
    if (dayDiff === 1) return "yesterday";
    if (dayDiff < 7) return `${dayDiff} days ago`;
    if (dayDiff < 30) return `${Math.floor(dayDiff / 7)} weeks ago`;
    return `${Math.floor(dayDiff / 30)} months ago`;
  }
}

// Format duration between two times
const getDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return "";
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = Math.abs(end - start);
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) {
    return `${diffMins} min`;
  } else {
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
  }
};

export default function NotificationDashboard({ sessions = [], subjectColorMap: externalColorMap }) {
  const navigate = useNavigate();
  
  // Sort sessions by date (most recent first)
  const sortedSessions = [...sessions]
    .filter(session => session.startTime)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 4);

  // Get today's date without time
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build subject color map if not provided
  const subjectColorMap = externalColorMap || getSubjectColorMap(sortedSessions.map(s => s.subject));

  return (
    <div className="space-y-4">
      <Card className="shadow-md hover-lift transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold flex items-center">
            <Bell className="h-5 w-5 text-primary mr-2" />
            Today's Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedSessions.length > 0 ? (
            sortedSessions.map((session, index) => {
              const sessionDate = new Date(session.startTime);
              const sessionDateCopy = new Date(session.startTime);
              const isToday = sessionDateCopy.setHours(0, 0, 0, 0) === today.getTime();
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              const isTomorrow = sessionDateCopy.getTime() === tomorrow.getTime();
              const subjectColor = subjectColorMap[session.subject] || generateColorFromString(session.subject);
              const duration = getDuration(session.startTime, session.endTime);
              
              let dateDisplay;
              if (isToday) {
                dateDisplay = "Today";
              } else if (isTomorrow) {
                dateDisplay = "Tomorrow";
              } else {
                dateDisplay = formatDateRelative(sessionDate);
              }

              // Status logic
              const now = new Date();
              const sessionEnd = new Date(session.endTime);
              let status = 'Upcoming';
              let statusColor = 'bg-blue-100 text-blue-700';
              if (sessionEnd < now) {
                if (session.progress === 100) {
                  status = 'Completed';
                  statusColor = 'bg-green-100 text-green-700';
                } else {
                  status = 'Missed';
                  statusColor = 'bg-red-100 text-red-700';
                }
              }

              return (
                <div 
                  key={index} 
                  className="p-3 rounded-lg border border-border/50 bg-card/50 hover:border-primary/30 hover:shadow-sm transition-all duration-300 relative overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/study-session?sessionId=${session._id}`)}
                >
                  <div 
                    className="absolute top-0 left-0 w-1 h-full" 
                    style={{ backgroundColor: subjectColor }}
                  ></div>
                  <div className="pl-2">
                    <h3 className="font-medium text-sm truncate pr-4">
                      {session.description || `${session.subject} Session`}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: subjectColor }}
                      />
                      <span className="text-xs">{session.subject}</span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor}`}>{status}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{dateDisplay}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {duration && <span className="opacity-75"> ({duration})</span>}
                        </span>
                      </div>
                    </div>
                    {session.documents?.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground flex items-start gap-1">
                        <Tag className="h-3 w-3 mt-0.5" />
                        <span className="truncate">{session.documents[0].title}</span>
                      </div>
                    )}
                  </div>
                  {isToday && (
                    <div className="absolute top-2 right-2">
                      <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded-full">
                        Today
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm mb-3">No upcoming sessions</p>
              <Button variant="outline" className="text-xs" size="sm" onClick={() => navigate("/add-session")}>
                Create Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md hover-lift transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold">Study Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="font-medium text-sm">Study Streak: 3 days! 🔥</p>
              <p className="text-xs text-muted-foreground mt-1">Keep it going!</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="font-medium text-sm">Weekly goal: 65% complete</p>
              <div className="w-full h-2 bg-muted rounded-full mt-2">
                <div className="h-full bg-primary rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 