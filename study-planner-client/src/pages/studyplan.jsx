import { useState, useEffect } from "react";
import { Button } from "../components/ui/Button"
import { CalendarIcon, Plus, ChevronLeft, ChevronRight, PieChart, ListChecks, Play, BarChart, Clock, Search, Filter, Book } from "lucide-react"
import StudyCalendar from "../components/StudyCalendar"
import UpcomingSessions from "../components/UpcomingSessions"
import Calendar from "../components/Calendar";
import NotificationDashboard from "../components/NotificationDashboard";
import { useToast } from "../lib/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs";
import StudyPlan from "../components/StudyPlan";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { useSubjects } from "../contexts/SubjectContext";
import FileSelectionModal from "../components/FileSelectionModal";

// Generate a color based on subject name
export const getSubjectColor = (subject) => {
  // Generate a consistent color based on subject name with more vibrant colors
  const subjectColors = {
    'Mathematics': '#4361ee', // more vibrant blue
    'Physics': '#3a0ca3',     // rich purple
    'Chemistry': '#f72585',   // bright pink
    'Biology': '#7209b7',     // deep purple
    'Computer Science': '#4cc9f0', // bright blue
    'Database': '#f94144',    // vibrant red
    'System Analysis': '#06d6a0' // bright teal
  };
  
  // Return the color if it exists in our mapping
  if (subjectColors[subject]) {
    return subjectColors[subject];
  }
  
  // Otherwise generate a vibrant color based on the subject string
  let hash = 0;
  for (let i = 0; i < subject?.length || 0; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate more vibrant hues
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 85%, 50%)`; // Increased saturation for more vivid colors
};

export default function StudyPlanPage() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("plan");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { subjects } = useSubjects();
  
  // State for the enhanced view tab
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [sessionTypeFilter, setSessionTypeFilter] = useState("upcoming");
  
  // State for file selection modal
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];
  
  // Filter sessions based on the view tab filters
  const getFilteredSessions = () => {
    if (!sessions || sessions.length === 0) return [];
    
    return sessions.filter(session => {
      // Filter by session type (upcoming, completed, or all)
      const sessionDate = session.startTime ? new Date(session.startTime).toISOString().split("T")[0] : '';
      const isUpcoming = sessionDate >= today;
      
      const matchesType = 
        (sessionTypeFilter === "upcoming" && isUpcoming) ||
        (sessionTypeFilter === "completed" && !isUpcoming) ||
        sessionTypeFilter === "all";
      
      // Filter by search query (subject or description)
      const matchesSearch =
        !searchQuery ||
        (session.subject && session.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (session.description && session.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Filter by subject
      const matchesSubject = subjectFilter === "all" || session.subject === subjectFilter;
      
      return matchesType && matchesSearch && matchesSubject;
    });
  };

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
      toast({
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

  const createDummySession = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/study-sessions/create-dummy`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create dummy session");
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: data.message || "Dummy session created successfully",
      });
      
      // Refresh the sessions list
      fetchSessions();
    } catch (error) {
      console.error("Error creating dummy session:", error);
      toast({
        title: "Error",
        description: "Failed to create dummy session",
        variant: "destructive"
      });
    }
  };

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

  // Function to handle date selection for creating new sessions
  const handleDateSelect = (selectInfo) => {
    const startTime = selectInfo.startStr;
    navigate(`/add-session?startTime=${encodeURIComponent(startTime)}`);
  };

  // Add a new function to handle launching a session with file selection
  const handleLaunchSession = (session) => {
    setSelectedSession(session);
    setShowFileSelector(true);
  };
  
  // Add a function to handle file selection and navigate to study session
  const handleFileSelected = (file) => {
    setShowFileSelector(false);
    
    // Navigate to study session with both session ID and file ID
    navigate(`/study-session?sessionId=${selectedSession._id}&noteId=${file._id}`);
  };

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <CalendarIcon className="mr-2 h-6 w-6 text-primary" />
              Study Plan
            </h1>
            <p className="text-gray-500 dark:text-gray-400">Schedule and manage your study sessions</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/add-session")}>
              <Plus className="mr-2 h-4 w-4" />
              New Study Session
            </Button>
            <Button variant="outline" onClick={createDummySession}>
              <Plus className="mr-2 h-4 w-4" />
              Create Test Session
            </Button>
          </div>
        </div>

        <Tabs defaultValue="plan" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 w-full justify-start">
            <TabsTrigger value="plan" className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              Plan <span className="text-xs text-muted-foreground ml-1">(calendar)</span>
            </TabsTrigger>
            <TabsTrigger value="launch" className="flex items-center gap-1">
              <Play className="h-4 w-4" />
              Launch <span className="text-xs text-muted-foreground ml-1">(sessions)</span>
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-1">
              <BarChart className="h-4 w-4" />
              Review <span className="text-xs text-muted-foreground ml-1">(session stats)</span>
            </TabsTrigger>
          </TabsList>

          {/* Plan Tab Content */}
          <TabsContent value="plan" className="mt-0">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                {/* Removing the duplicated month navigation here */}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative hidden md:block w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search sessions..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
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
                {(() => {
                  // Log all sessions for debugging
                  console.log('All sessions:', sessions);
                  console.log('Filtered sessions:', getFilteredSessions());
                  
                  const calendarEvents = getFilteredSessions().map(session => {
                    // Validate session has required fields
                    if (!session._id || !session.startTime || !session.endTime || !session.subject) {
                      console.warn('Invalid session data:', session);
                      return null;
                    }
                    
                    // Format dates properly, ensuring ISO format
                    let startStr = session.startTime;
                    let endStr = session.endTime;
                    
                    // Create proper Date objects
                    let start, end;
                    try {
                      // Handle string or Date object inputs
                      start = new Date(startStr);
                      end = new Date(endStr);
                      
                      // Validate dates are valid
                      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                        throw new Error('Invalid date');
                      }

                      // Ensure the times are sufficiently different to display properly
                      const durationMs = end.getTime() - start.getTime();
                      if (durationMs < 900000) { // less than 15 minutes
                        // Make session at least 30 minutes long for visibility
                        end = new Date(start.getTime() + 1800000); // add 30 minutes
                        console.log(`Extended short session duration for ${session.subject}`);
                      }
                      
                      // Ensure the dates are properly formatted for FullCalendar
                      startStr = start.toISOString();
                      endStr = end.toISOString();
                      
                    } catch (error) {
                      console.error(`Error parsing dates for session ${session._id}:`, error);
                      return null;
                    }
                    
                    // Get a vivid color for the subject
                    const color = getSubjectColor(session.subject);
                    
                    // Log each event creation for debugging
                    console.log(`Creating event for ${session.subject}:`, {
                      id: session._id,
                      start: startStr,
                      end: endStr,
                      color: color
                    });
                    
                    // Return a properly formatted event object for FullCalendar
                    return {
                      id: session._id,
                      title: session.subject,
                      start: startStr, // Use ISO format string
                      end: endStr,     // Use ISO format string
                      backgroundColor: color,
                      borderColor: color,
                      textColor: '#ffffff',
                      description: session.description || '',
                      allDay: false,
                      display: 'block', // Force block display mode
                      extendedProps: {
                        description: session.description || '',
                        subjectId: session.subjectId || '',
                        _id: session._id, // Ensure ID is available
                      }
                    };
                  }).filter(Boolean); // Remove any invalid events (null entries)
                  
                  console.log('Final calendar events:', calendarEvents);
                  
                  return (
                    <Calendar 
                      events={calendarEvents} 
                      onDateSelect={handleDateSelect}
                      key={calendarEvents.length} // Force re-render when events change
                    />
                  );
                })()}
              </div>
              <div>
                <div className="mb-4">
                  <div className="relative w-full">
                    <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <select
                      className="w-full pl-8 h-10 rounded-md border border-input bg-background px-3 py-2"
                      value={subjectFilter}
                      onChange={(e) => setSubjectFilter(e.target.value)}
                    >
                      <option value="all">All Subjects</option>
                      {sessions.reduce((subjects, session) => {
                        if (!subjects.includes(session.subject)) {
                          subjects.push(session.subject);
                        }
                        return subjects;
                      }, []).map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <NotificationDashboard sessions={getFilteredSessions()} />
              </div>
            </div>
          </TabsContent>

          {/* Launch Tab Content */}
          <TabsContent value="launch" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-card rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Play className="h-5 w-5 text-primary" />
                    Launch Study Sessions
                  </h2>
                  
                  <div className="space-y-6">
                    {/* Today's Sessions Section */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-2">Today's Sessions</h3>
                      {sessions.filter(session => {
                        const sessionDate = new Date(session.startTime);
                        const today = new Date();
                        return sessionDate.toDateString() === today.toDateString();
                      }).length > 0 ? (
                        <div className="space-y-2">
                          {sessions.filter(session => {
                            const sessionDate = new Date(session.startTime);
                            const today = new Date();
                            return sessionDate.toDateString() === today.toDateString();
                          }).map((session, index) => {
                            const startTime = new Date(session.startTime);
                            const endTime = new Date(session.endTime);
                            const duration = getDuration(startTime, endTime);
                            return (
                              <div key={session._id || index} className="bg-card rounded-lg p-4 border border-border flex justify-between items-center hover:border-primary transition-colors">
                                <div>
                                  <h4 className="font-medium">{session.subject} {session.description ? `- ${session.description}` : ""}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                                    {endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({duration})
                                  </p>
                                </div>
                                <Button 
                                  className="bg-primary hover:bg-primary/90"
                                  onClick={() => handleLaunchSession(session)}
                                >
                                  Start Session
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No sessions scheduled for today.</p>
                      )}
                    </div>
                    
                    {/* Create Quick Session */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-2">Create Quick Session</h3>
                      <div className="bg-card rounded-lg p-4 border border-border">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Subject</label>
                            <select 
                              className="w-full p-2 rounded-md border border-border bg-background"
                              id="quickSessionSubject"
                            >
                              {sessions.reduce((subjects, session) => {
                                if (!subjects.includes(session.subject)) {
                                  subjects.push(session.subject);
                                }
                                return subjects;
                              }, []).map((subject) => (
                                <option key={subject} value={subject}>
                                  {subject}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Duration</label>
                            <select 
                              className="w-full p-2 rounded-md border border-border bg-background"
                              id="quickSessionDuration"
                            >
                              <option value="30">30 minutes</option>
                              <option value="45">45 minutes</option>
                              <option value="60">60 minutes</option>
                              <option value="90">90 minutes</option>
                              <option value="120">120 minutes</option>
                            </select>
                          </div>
                        </div>
                        <Button 
                          className="w-full bg-primary hover:bg-primary/90"
                          onClick={() => {
                            const subject = document.getElementById("quickSessionSubject").value;
                            const durationMinutes = parseInt(document.getElementById("quickSessionDuration").value);
                            
                            // Create start and end times
                            const startTime = new Date();
                            const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
                            
                            // Create session payload
                            const sessionData = {
                              subject,
                              startTime: startTime.toISOString(),
                              endTime: endTime.toISOString(),
                              description: `Quick ${durationMinutes}-minute session`
                            };
                            
                            // Create and start the session
                            fetch(
                              `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/study-sessions`,
                              {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                                },
                                body: JSON.stringify(sessionData)
                              }
                            )
                            .then(response => {
                              if (!response.ok) throw new Error("Failed to create session");
                              return response.json();
                            })
                            .then(data => {
                              toast({
                                title: "Session Created",
                                description: "Your quick study session has been created"
                              });
                              
                              // Instead of navigating directly, set the selected session and show file selector
                              setSelectedSession(data);
                              setShowFileSelector(true);
                            })
                            .catch(error => {
                              console.error("Error creating quick session:", error);
                              toast({
                                title: "Error",
                                description: "Failed to create quick session",
                                variant: "destructive"
                              });
                            });
                          }}
                        >
                          Start Immediate Session
                        </Button>
                      </div>
                    </div>
                    
                    {/* Upcoming Sessions from Plan */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-2">Upcoming Sessions from Plan</h3>
                      {sessions.filter(session => {
                        const sessionDate = new Date(session.startTime);
                        const today = new Date();
                        return sessionDate > today && sessionDate.toDateString() !== today.toDateString();
                      }).length > 0 ? (
                        <div className="space-y-2">
                          {sessions.filter(session => {
                            const sessionDate = new Date(session.startTime);
                            const today = new Date();
                            return sessionDate > today && sessionDate.toDateString() !== today.toDateString();
                          }).slice(0, 3).map((session, index) => {
                            const startTime = new Date(session.startTime);
                            const endTime = new Date(session.endTime);
                            const duration = getDuration(startTime, endTime);
                            return (
                              <div key={session._id || index} className="bg-card rounded-lg p-4 border border-border">
                                <h4 className="font-medium">{session.subject} {session.description ? `- ${session.description}` : ""}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                                  {endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({duration})
                                </p>
                              </div>
                            );
                          })}
                          {sessions.filter(session => {
                            const sessionDate = new Date(session.startTime);
                            const today = new Date();
                            return sessionDate > today && sessionDate.toDateString() !== today.toDateString();
                          }).length > 3 && (
                            <Button 
                              variant="outline" 
                              className="w-full mt-2"
                              onClick={() => setActiveTab("plan")}
                            >
                              View All in Plan
                            </Button>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No upcoming sessions scheduled.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Sidebar - Subjects with Uploaded Files */}
              <div className="space-y-6">
                <Card className="shadow-md hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center">
                      <Book className="h-5 w-5 text-primary mr-2" />
                      Subjects with Files
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {sessions.reduce((subjects, session) => {
                        if (!subjects.includes(session.subject)) {
                          subjects.push(session.subject);
                        }
                        return subjects;
                      }, []).slice(0, 5).map((subject, index) => {
                        // Find the subject in the subjects context to get the actual file count
                        const subjectInfo = subjects.find(s => s.name === subject);
                        const fileCount = subjectInfo ? subjectInfo.documentsCount || 0 : 0;
                        
                        return (
                          <div 
                            key={subject} 
                            className="p-3 rounded-lg border border-border bg-card/50 hover:border-primary/30 hover:bg-card transition-colors cursor-pointer"
                            onClick={() => navigate(`/notebook?subject=${encodeURIComponent(subject)}`)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div 
                                  className="h-8 w-8 rounded-full mr-3 flex items-center justify-center text-white"
                                  style={{ backgroundColor: getSubjectColor(subject) }}
                                >
                                  {subject.charAt(0)}
                                </div>
                                <div>
                                  <h3 className="font-medium">{subject}</h3>
                                  <p className="text-xs text-muted-foreground">
                                    {fileCount} {fileCount === 1 ? 'file' : 'files'}
                                  </p>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/notebook')}>
                      View All Materials
                    </Button>
                  </CardContent>
                </Card>
                
                {/* Study Stats Summary */}
                <Card className="shadow-md hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center">
                      <PieChart className="h-5 w-5 text-primary mr-2" />
                      Study Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Sessions</span>
                        <span>{sessions.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Hours This Week</span>
                        <span>
                          {sessions.reduce((total, session) => {
                            const start = new Date(session.startTime);
                            const end = new Date(session.endTime);
                            const now = new Date();
                            const weekAgo = new Date(now.setDate(now.getDate() - 7));
                            if (start >= weekAgo && start <= new Date()) {
                              return total + ((end - start) / 3600000);
                            }
                            return total;
                          }, 0).toFixed(1)}h
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Completed Sessions</span>
                        <span>{Math.floor(sessions.length * 0.7)}</span>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full mt-4" onClick={() => setActiveTab("review")}>
                      View Full Analytics
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Review Tab Content */}
          <TabsContent value="review" className="mt-0">
            <div className="bg-card rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BarChart className="h-5 w-5 text-primary" />
                Session Statistics
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Weekly Summary</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-card p-3 rounded-lg text-center">
                        <p className="text-xl font-bold">8</p>
                        <p className="text-xs text-muted-foreground">Sessions</p>
                      </div>
                      <div className="bg-card p-3 rounded-lg text-center">
                        <p className="text-xl font-bold">12h</p>
                        <p className="text-xs text-muted-foreground">Total Time</p>
                      </div>
                      <div className="bg-card p-3 rounded-lg text-center">
                        <p className="text-xl font-bold">86%</p>
                        <p className="text-xs text-muted-foreground">Completion</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Performance Trends</h3>
                    <div className="bg-muted/50 rounded-lg p-4 h-48 flex items-center justify-center">
                      <p className="text-muted-foreground text-sm">Performance chart will appear here</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium mb-2">Recent Sessions</h3>
                  
                  {[1, 2, 3].map((session) => (
                    <div key={session} className="bg-muted/30 rounded-lg p-3 border border-border">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{
                            session === 1 ? "Physics - Mechanics" :
                            session === 2 ? "Mathematics - Calculus" :
                            "Chemistry - Organic Compounds"
                          }</h4>
                          <p className="text-xs text-muted-foreground">
                            {
                              session === 1 ? "Yesterday, 3:00 PM" :
                              session === 2 ? "2 days ago, 10:00 AM" :
                              "3 days ago, 2:30 PM"
                            }
                          </p>
                        </div>
                        <div className="rounded-full bg-primary/10 text-primary px-2 py-1 text-xs">
                          {
                            session === 1 ? "Completed" :
                            session === 2 ? "Completed" :
                            "Partial"
                          }
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>{
                            session === 1 ? "60 minutes" :
                            session === 2 ? "90 minutes" :
                            "45 minutes"
                          }</span>
                        </div>
                        <Button variant="outline" size="sm" className="text-xs h-7">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Button variant="outline" className="w-full mt-2">
                    View All Sessions
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Add the FileSelectionModal */}
      <FileSelectionModal 
        open={showFileSelector}
        onClose={() => setShowFileSelector(false)}
        subject={selectedSession?.subject}
        onSelectFile={handleFileSelected}
      />
    </div>
  )
}
