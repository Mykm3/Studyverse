import { useState, useEffect } from "react";
import { Button } from "../components/ui/Button"
import { CalendarIcon, Plus, ChevronLeft, ChevronRight, PieChart, ListChecks, Play, BarChart, Clock, Search, Filter, Book, Sparkles, TrendingUp } from "lucide-react"
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
import { PlanModal } from "../components/PlanModal";
import api from "../utils/api";

// Fixed color palette for subjects
const SUBJECT_COLOR_PALETTE = [
  '#4361ee', // blue
  '#3a0ca3', // purple
  '#f72585', // pink
  '#7209b7', // deep purple
  '#4cc9f0', // bright blue
  '#f94144', // red
  '#06d6a0', // teal
  '#ffbe0b', // yellow
  '#8338ec', // violet
  '#3a86ff', // sky blue
  '#ff006e', // magenta
  '#fb5607', // orange
  '#43aa8b', // green
  '#b5179e', // dark magenta
  '#ffb4a2', // peach
];

// Generate a vibrant color based on a string (fallback)
function generateColorFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 85%, 50%)`;
}

// Assign unique colors to subjects
function getSubjectColorMap(subjects) {
  const colorMap = {};
  const uniqueSubjects = Array.from(new Set(subjects.map(s => typeof s === 'string' ? s : s.name)));
  uniqueSubjects.forEach((subject, idx) => {
    if (idx < SUBJECT_COLOR_PALETTE.length) {
      colorMap[subject] = SUBJECT_COLOR_PALETTE[idx];
    } else {
      colorMap[subject] = generateColorFromString(subject);
    }
  });
  return colorMap;
}

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
  

  
  // State for the Generate Plan modal
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isCreatingImmediateSession, setIsCreatingImmediateSession] = useState(false);
  const [planForm, setPlanForm] = useState({
    preferredTimes: '',
    preferredDays: '',
    sessionLength: '',
    subjects: '',
  });
  
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
      console.log('Fetched sessions data:', data);
      console.log('Setting sessions state with', data.length, 'sessions');
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

  // Debug effect to monitor sessions state changes
  useEffect(() => {
    console.log('Sessions state changed:', sessions.length, 'sessions');
  }, [sessions]);

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

  // Add a new function to handle launching a session directly
  const handleLaunchSession = (session) => {
    // Navigate directly to study session with session ID
    navigate(`/study-session?sessionId=${session._id}`);
  };

  // Handler for opening the Generate Plan modal
  const handleOpenPlanModal = () => setShowPlanModal(true);
  const handleClosePlanModal = () => setShowPlanModal(false);
  const handlePlanFormChange = (e) => {
    setPlanForm({ ...planForm, [e.target.name]: e.target.value });
  };
  const handlePlanSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement plan generation logic here
    toast({ title: "Plan generation coming soon!", description: JSON.stringify(planForm) });
    setShowPlanModal(false);
  };

  // AI-powered study plan generation
  const handleGenerateAIPlan = async (formData) => {
    setIsGeneratingPlan(true);
    try {
      console.log('Generating AI study plan with:', formData);
      
      // First, clear existing AI-generated sessions
      console.log('Clearing existing AI-generated sessions...');
      const sessionsResponse = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/study-sessions`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      if (!sessionsResponse.ok) {
        console.error('Failed to fetch current sessions:', sessionsResponse.status, sessionsResponse.statusText);
        throw new Error(`Failed to fetch current sessions: ${sessionsResponse.status}`);
      }
      
      const currentSessions = await sessionsResponse.json();
      
      if (!Array.isArray(currentSessions)) {
        console.error('Current sessions is not an array:', currentSessions);
        throw new Error('Invalid response format: expected array of sessions');
      }
      
      // Filter out all sessions from current day onwards (both AI-generated and manual)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      
      console.log('Current sessions to check:', currentSessions.map(s => ({
        id: s._id,
        subject: s.subject,
        startTime: s.startTime,
        isAIGenerated: s.isAIGenerated
      })));
      
      const sessionsToDelete = currentSessions.filter(session => {
        if (!session.startTime) {
          console.log(`Session ${session._id}: no startTime, skipping`);
          return false;
        }
        
        const sessionDate = new Date(session.startTime);
        const isFutureOrToday = sessionDate >= today;
        
        console.log(`Session ${session._id}: ${session.subject} on ${sessionDate.toISOString().split('T')[0]} - ${isFutureOrToday ? 'FUTURE/TODAY' : 'PAST'}`);
        
        return isFutureOrToday;
      });
      
      // Delete all future sessions from backend
      if (sessionsToDelete.length > 0) {
        console.log(`Attempting to delete ${sessionsToDelete.length} future sessions (from today onwards)`);
        
        toast({
          title: "Clearing Future Sessions",
          description: `Removing ${sessionsToDelete.length} sessions from today onwards...`,
        });
        
        // Try to delete sessions one by one to avoid complete failure
        let deletedCount = 0;
        let failedCount = 0;
        
        for (const session of sessionsToDelete) {
          try {
            console.log(`Attempting to delete session: ${session._id} (${session.subject})`);
            const response = await fetch(
              `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/study-sessions/${session._id}`,
              {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }
            );
            
            if (response.ok) {
              deletedCount++;
              console.log(`✅ Successfully deleted session ${session._id}`);
            } else {
              failedCount++;
              const errorText = await response.text();
              console.error(`❌ Failed to delete session ${session._id}:`, response.status, errorText);
            }
          } catch (error) {
            failedCount++;
            console.error(`❌ Error deleting session ${session._id}:`, error);
          }
        }
        
        console.log(`Deletion summary: ${deletedCount} deleted, ${failedCount} failed`);
        
        if (deletedCount > 0) {
          if (deletedCount === sessionsToDelete.length) {
            toast({
              title: "Cleanup Complete",
              description: `Successfully cleared all ${deletedCount} future sessions.`,
              variant: "default"
            });
          } else {
            toast({
              title: "Partial Cleanup",
              description: `Cleared ${deletedCount} of ${sessionsToDelete.length} future sessions. ${failedCount} failed.`,
              variant: "default"
            });
          }
        } else {
          console.log('❌ No sessions were deleted - all deletions failed');
          toast({
            title: "Cleanup Failed",
            description: `Couldn't delete any future sessions (${failedCount} failed). Continuing with new plan generation.`,
            variant: "destructive"
          });
        }
        
        // Force refresh sessions after deletion
        console.log('🔄 Refreshing sessions after deletion...');
        await fetchSessions();
        console.log('✅ Sessions refreshed after deletion');
        
        // Check what sessions remain after deletion
        const remainingSessions = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/study-sessions`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        ).then(res => res.json());
        
        console.log('📊 Remaining sessions after deletion:', remainingSessions.length);
        console.log('📊 Remaining future sessions:', remainingSessions.filter(s => {
          if (!s.startTime) return false;
          const sessionDate = new Date(s.startTime);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return sessionDate >= today;
        }).length);
        
        // If no sessions were deleted, show a warning but continue
        if (deletedCount === 0) {
          console.warn('⚠️ No future sessions were deleted - this might cause duplicate sessions');
        }
      } else {
        console.log('✅ No future sessions to clear');
      }
      
      const response = await api.post('/api/groq/studyplan', formData);
      console.log('API response:', response);
      
      if (!response) {
        throw new Error('No response data received from server');
      }
      
      if (response.success && response.plan) {
        const plan = response.plan;
        
        // Convert AI plan to calendar events
        const newSessions = [];
        let sessionId = 1;
        
        plan.weeks.forEach(week => {
          week.sessions.forEach(session => {
            newSessions.push({
              _id: `ai-generated-${sessionId++}`,
              subject: session.subject,
              startTime: session.startTime,
              endTime: session.endTime,
              description: `${session.subject} Session`, // Simple fallback description
              status: 'scheduled',
              progress: 0,
              learningStyle: session.learningStyle || 'balanced',
              isAIGenerated: true
            });
          });
        });

        // Save the new sessions to the backend
        try {
          console.log('Saving', newSessions.length, 'sessions to backend...');
          const savePromises = newSessions.map(session => 
            api.post('/api/study-sessions', {
              subject: session.subject,
              startTime: session.startTime,
              endTime: session.endTime,
              description: `${session.subject} Session`,
              isAIGenerated: true
            })
          );
          
          const saveResults = await Promise.all(savePromises);
          console.log('Save results:', saveResults);
          
          // Update sessions state directly with the saved sessions
          const savedSessions = saveResults.map(result => ({
            _id: result._id || result.id,
            subject: result.subject,
            startTime: result.startTime,
            endTime: result.endTime,
            description: result.description,
            status: result.status || 'scheduled',
            progress: result.progress || 0,
            isAIGenerated: result.isAIGenerated || true
          }));
          
          console.log('Updating sessions state with', savedSessions.length, 'new sessions');
          setSessions(prevSessions => [...prevSessions, ...savedSessions]);
          
          // Also refresh from backend to ensure consistency
          console.log('Refreshing sessions from backend...');
          await fetchSessions();
          
          toast({
            title: "Study Plan Generated!",
            description: `Successfully created ${newSessions.length} study sessions for ${formData.subjects.length} subjects.`,
          });
        } catch (saveError) {
          console.error('Failed to save sessions:', saveError);
          // Still show the sessions locally even if save failed
          setSessions(prevSessions => [...prevSessions, ...newSessions]);
          
          toast({
            title: "Plan Generated (Local Only)",
            description: `Created ${newSessions.length} sessions locally. Some may not be saved to the server.`,
            variant: "destructive"
          });
        }
        
        setShowPlanModal(false);
      } else {
        throw new Error('Invalid response from AI service');
      }
    } catch (error) {
      console.error('Failed to generate AI study plan:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        responseData: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = "Failed to generate study plan. Please try again.";
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Add helpful fallback suggestions
      if (errorMessage.includes("unrecognized subject names") || errorMessage.includes("parse")) {
        errorMessage += "\n\n💡 Try reducing the number of subjects or increasing your weekly hours.";
      } else if (errorMessage.includes("past")) {
        errorMessage += "\n\n💡 The AI created sessions in the past. Please try again.";
      } else if (errorMessage.includes("too large") || errorMessage.includes("truncated")) {
        errorMessage += "\n\n💡 Try reducing the number of weeks or subjects.";
      }
      
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Build a list of all subject names from sessions and subjects context
  const allSubjectNames = Array.from(new Set([
    ...sessions.map(s => s.subject),
    ...(Array.isArray(subjects) ? subjects.map(s => s.name) : [])
  ].filter(Boolean)));
  const subjectColorMap = getSubjectColorMap(allSubjectNames);

  // Filter out invalid or deleted sessions for review tab
  const validSessions = sessions.filter(s => {
    // Check if session has required fields
    if (!s._id || !s.subject || !s.startTime || !s.endTime) return false;
    
    // Check if session is not marked as deleted
    if (s.status === 'deleted' || s.isDeleted) return false;
    
    // Check if dates are valid
    const startDate = new Date(s.startTime);
    const endDate = new Date(s.endTime);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return false;
    
    // Check if end time is after start time
    if (endDate <= startDate) return false;
    
    return true;
  });

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
            <Button 
              variant="gradient"
              onClick={handleOpenPlanModal}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate AI Plan
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
                  
                  const now = new Date();
                  const calendarEvents = (sessions || []).map(session => {
                    if (!session._id || !session.startTime || !session.endTime || !session.subject) {
                      console.warn('Invalid session data:', session);
                      return null;
                    }
                    let startStr = session.startTime;
                    let endStr = session.endTime;
                    let start, end;
                    try {
                      start = new Date(startStr);
                      end = new Date(endStr);
                      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                        throw new Error('Invalid date');
                      }
                      const durationMs = end.getTime() - start.getTime();
                      if (durationMs < 900000) {
                        end = new Date(start.getTime() + 1800000);
                      }
                      startStr = start.toISOString();
                      endStr = end.toISOString();
                    } catch (error) {
                      console.error(`Error parsing dates for session ${session._id}:`, error);
                      return null;
                    }
                    const color = subjectColorMap[session.subject] || generateColorFromString(session.subject);
                    // Determine status - prioritize progress over time
                    let status = 'upcoming';
                    let backgroundColor = color;
                    let borderColor = color;
                    
                    // Check if session is completed (progress = 100 OR status = 'completed')
                    const isCompleted = session.progress === 100 || session.status === 'completed';
                    
                    if (isCompleted) {
                      status = 'completed';
                      // Keep original subject color for completed sessions
                      backgroundColor = color;
                      borderColor = color;
                    } else if (end < now) {
                      // Only show as missed if it's past due AND not completed
                      status = 'missed';
                      backgroundColor = '#ef4444'; // Red background for missed sessions
                      borderColor = '#ef4444';
                    }
                    return {
                      id: session._id,
                      title: session.subject,
                      start: startStr,
                      end: endStr,
                      backgroundColor: backgroundColor,
                      borderColor: borderColor,
                      textColor: '#ffffff',
                      description: session.description || '',
                      allDay: false,
                      display: 'block',
                      extendedProps: {
                        description: session.description || '',
                        subjectId: session.subjectId || '',
                        _id: session._id,
                        status,
                        progress: session.progress,
                        originalSession: session
                      }
                    };
                  }).filter(Boolean);
                  
                  console.log('Final calendar events:', calendarEvents);
                  console.log('Calendar events count:', calendarEvents.length);
                  
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
                <NotificationDashboard sessions={getFilteredSessions()} subjectColorMap={subjectColorMap} />
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
                    
                    {/* Create Immediate Session */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-2">Create Immediate Session</h3>
                      <p className="text-sm text-muted-foreground mb-3">Create a study session that starts now and add it to today's sessions list.</p>
                      <div className="bg-card rounded-lg p-4 border border-border">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Subject</label>
                            <select 
                              className="w-full p-2 rounded-md border border-border bg-background"
                              id="quickSessionSubject"
                            >
                              <option value="">Select a subject</option>
                              {Array.isArray(subjects) ? subjects.map((subject) => (
                                <option key={subject.name} value={subject.name}>
                                  {subject.name}
                                </option>
                              )) : []}
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
                          disabled={isCreatingImmediateSession}
                          onClick={async () => {
                            const subject = document.getElementById("quickSessionSubject").value;
                            const durationMinutes = parseInt(document.getElementById("quickSessionDuration").value);
                            
                            if (!subject) {
                              toast({
                                title: "Error",
                                description: "Please select a subject",
                                variant: "destructive"
                              });
                              return;
                            }
                            
                            setIsCreatingImmediateSession(true);
                            
                            try {
                              // Create start and end times
                              const startTime = new Date();
                              const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
                              
                              // Create session payload
                              const sessionData = {
                                subject,
                                startTime: startTime.toISOString(),
                                endTime: endTime.toISOString(),
                                description: `Immediate ${durationMinutes}-minute session`
                              };
                              
                              // Create the session
                              const response = await fetch(
                                `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/study-sessions`,
                                {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                                  },
                                  body: JSON.stringify(sessionData)
                                }
                              );
                              
                              if (!response.ok) {
                                throw new Error("Failed to create session");
                              }
                              
                              const data = await response.json();
                              
                              toast({
                                title: "Session Created",
                                description: "Your immediate study session has been added to today's sessions"
                              });
                              
                              // Refresh the sessions list to show the new session
                              await fetchSessions();
                              
                            } catch (error) {
                              console.error("Error creating immediate session:", error);
                              toast({
                                title: "Error",
                                description: "Failed to create immediate session",
                                variant: "destructive"
                              });
                            } finally {
                              setIsCreatingImmediateSession(false);
                            }
                          }}
                        >
                          {isCreatingImmediateSession ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Creating...
                            </>
                          ) : (
                            "Create Immediate Session"
                          )}
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
                      {Array.isArray(subjects) ? subjects
                        .filter(subject => (subject.documentsCount || 0) > 0)
                        .slice(0, 5)
                        .map((subject) => (
                          <div 
                            key={subject.name} 
                            className="p-3 rounded-lg border border-border bg-card/50 hover:border-primary/30 hover:bg-card transition-colors cursor-pointer"
                            onClick={() => navigate(`/notebook?subject=${encodeURIComponent(subject.name)}`)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div 
                                  className="h-8 w-8 rounded-full mr-3 flex items-center justify-center text-white"
                                  style={{ backgroundColor: subjectColorMap[subject.name] || generateColorFromString(subject.name) }}
                                >
                                  {subject.name.charAt(0)}
                                </div>
                                <div>
                                  <h3 className="font-medium">{subject.name}</h3>
                                  <p className="text-xs text-muted-foreground">
                                    {subject.documentsCount} {subject.documentsCount === 1 ? 'file' : 'files'}
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
                        )) : []}
                      {Array.isArray(subjects) && subjects.filter(subject => (subject.documentsCount || 0) > 0).length === 0 && (
                        <p className="text-muted-foreground text-center py-4">No subjects with files found.</p>
                      )}
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
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                  const now = new Date();
                  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                  
                  // Calculate statistics using only valid sessions
                  const totalSessions = validSessions.length;
                  const completedSessions = validSessions.filter(s => s.progress === 100 || s.status === 'completed').length;
                  const missedSessions = validSessions.filter(s => {
                    const sessionDate = new Date(s.startTime);
                    return sessionDate < now && (s.progress < 100 && s.status !== 'completed');
                  }).length;
                  const upcomingSessions = validSessions.filter(s => {
                    const sessionDate = new Date(s.startTime);
                    return sessionDate > now;
                  }).length;
                  
                  // Calculate time statistics using only valid sessions
                  const totalStudyTime = validSessions.reduce((total, session) => {
                    const start = new Date(session.startTime);
                    const end = new Date(session.endTime);
                    return total + (end - start) / (1000 * 60 * 60); // Convert to hours
                  }, 0);
                  
                  const weeklyStudyTime = validSessions.filter(s => {
                    const sessionDate = new Date(s.startTime);
                    return sessionDate >= weekAgo;
                  }).reduce((total, session) => {
                    const start = new Date(session.startTime);
                    const end = new Date(session.endTime);
                    return total + (end - start) / (1000 * 60 * 60);
                  }, 0);
                  
                  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
                  
                  return [
                    {
                      title: "Total Sessions",
                      value: totalSessions,
                      icon: <BarChart className="h-5 w-5" />,
                      color: "text-blue-600",
                      bgColor: "bg-blue-50 dark:bg-blue-900/20"
                    },
                    {
                      title: "Completed",
                      value: completedSessions,
                      subtitle: `${completionRate}% rate`,
                      icon: <ListChecks className="h-5 w-5" />,
                      color: "text-green-600",
                      bgColor: "bg-green-50 dark:bg-green-900/20"
                    },
                    {
                      title: "Weekly Hours",
                      value: `${weeklyStudyTime.toFixed(1)}h`,
                      subtitle: "This week",
                      icon: <Clock className="h-5 w-5" />,
                      color: "text-purple-600",
                      bgColor: "bg-purple-50 dark:bg-purple-900/20"
                    },
                    {
                      title: "Total Study Time",
                      value: `${totalStudyTime.toFixed(1)}h`,
                      subtitle: "All time",
                      icon: <BarChart className="h-5 w-5" />,
                      color: "text-orange-600",
                      bgColor: "bg-orange-50 dark:bg-orange-900/20"
                    }
                  ];
                })().map((stat, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                          <p className="text-2xl font-bold">{stat.value}</p>
                          {stat.subtitle && (
                            <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                          )}
                        </div>
                        <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                          <div className={stat.color}>{stat.icon}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Main Analytics Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Subject Performance */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-primary" />
                        Subject Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                                                 // Group sessions by subject and calculate performance
                         const subjectStats = {};
                         validSessions.forEach(session => {
                           if (!session.subject) return;
                          
                          if (!subjectStats[session.subject]) {
                            subjectStats[session.subject] = {
                              total: 0,
                              completed: 0,
                              totalTime: 0,
                              avgProgress: 0,
                              progressSum: 0
                            };
                          }
                          
                          subjectStats[session.subject].total++;
                          if (session.progress === 100 || session.status === 'completed') {
                            subjectStats[session.subject].completed++;
                          }
                          
                          if (session.startTime && session.endTime) {
                            const start = new Date(session.startTime);
                            const end = new Date(session.endTime);
                            subjectStats[session.subject].totalTime += (end - start) / (1000 * 60 * 60);
                          }
                          
                          subjectStats[session.subject].progressSum += session.progress || 0;
                        });
                        
                        // Calculate averages and percentages
                        Object.keys(subjectStats).forEach(subject => {
                          const stats = subjectStats[subject];
                          stats.completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                          stats.avgProgress = stats.total > 0 ? Math.round(stats.progressSum / stats.total) : 0;
                        });
                        
                        const sortedSubjects = Object.entries(subjectStats)
                          .sort(([,a], [,b]) => b.completionRate - a.completionRate);
                        
                        return (
                          <div className="space-y-4">
                            {sortedSubjects.map(([subject, stats], index) => (
                              <div key={subject} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: subjectColorMap[subject] || generateColorFromString(subject) }}
                                  />
                                  <div>
                                    <p className="font-medium">{subject}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {stats.total} sessions • {stats.totalTime.toFixed(1)}h
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">{stats.completionRate}%</p>
                                  <p className="text-sm text-muted-foreground">completed</p>
                                </div>
                              </div>
                            ))}
                            {sortedSubjects.length === 0 && (
                              <p className="text-center text-muted-foreground py-8">
                                No session data available
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Recent Sessions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const now = new Date();
                                                 const recentSessions = validSessions
                           .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
                           .slice(0, 5);
                        
                        return (
                          <div className="space-y-3">
                            {recentSessions.map((session, index) => {
                              const startTime = new Date(session.startTime);
                              const endTime = session.endTime ? new Date(session.endTime) : null;
                              const duration = endTime ? getDuration(startTime, endTime) : '';
                              const isCompleted = session.progress === 100 || session.status === 'completed';
                              const isPast = startTime < now;
                              
                              return (
                                <div key={session._id || index} className="p-3 bg-muted/30 rounded-lg">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h4 className="font-medium text-sm">{session.subject}</h4>
                                      <p className="text-xs text-muted-foreground">
                                        {startTime.toLocaleDateString()} • {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        {duration && ` • ${duration}`}
                                      </p>
                                    </div>
                                    <div className={`px-2 py-1 rounded-full text-xs ${
                                      isCompleted 
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                        : isPast
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                    }`}>
                                      {isCompleted ? 'Completed' : isPast ? 'Missed' : 'Upcoming'}
                                    </div>
                                  </div>
                                  {session.progress !== undefined && session.progress !== 100 && (
                                    <div className="mt-2">
                                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                        <span>Progress</span>
                                        <span>{session.progress}%</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div 
                                          className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                          style={{ width: `${session.progress}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {recentSessions.length === 0 && (
                              <p className="text-center text-muted-foreground py-8">
                                No recent sessions
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Performance Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const now = new Date();
                    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    const weeklyData = weekDays.map(day => ({ day, hours: 0, sessions: 0 }));
                    
                                         // Calculate weekly study hours
                     validSessions.forEach(session => {
                      
                      const sessionDate = new Date(session.startTime);
                      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                      
                      if (sessionDate >= weekAgo) {
                        const dayIndex = sessionDate.getDay();
                        const start = new Date(session.startTime);
                        const end = new Date(session.endTime);
                        const hours = (end - start) / (1000 * 60 * 60);
                        
                        weeklyData[dayIndex].hours += hours;
                        weeklyData[dayIndex].sessions += 1;
                      }
                    });
                    
                    const maxHours = Math.max(...weeklyData.map(d => d.hours));
                    
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-7 gap-2">
                          {weeklyData.map((day, index) => (
                            <div key={day.day} className="text-center">
                              <div className="text-xs text-muted-foreground mb-2">{day.day}</div>
                              <div className="relative h-24 bg-muted/30 rounded-lg flex flex-col justify-end p-2">
                                <div 
                                  className="bg-primary rounded-t-sm transition-all duration-500"
                                  style={{ 
                                    height: maxHours > 0 ? `${(day.hours / maxHours) * 100}%` : '0%',
                                    minHeight: day.hours > 0 ? '4px' : '0px'
                                  }}
                                />
                                <div className="text-xs font-medium mt-1">
                                  {day.hours > 0 ? `${day.hours.toFixed(1)}h` : '-'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {day.sessions} {day.sessions === 1 ? 'session' : 'sessions'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                          {(() => {
                            const totalWeeklyHours = weeklyData.reduce((sum, day) => sum + day.hours, 0);
                            const totalWeeklySessions = weeklyData.reduce((sum, day) => sum + day.sessions, 0);
                            const avgSessionLength = totalWeeklySessions > 0 ? totalWeeklyHours / totalWeeklySessions : 0;
                            
                            return [
                              {
                                title: "Weekly Total",
                                value: `${totalWeeklyHours.toFixed(1)}h`,
                                subtitle: "Study time this week"
                              },
                              {
                                title: "Daily Average",
                                value: `${(totalWeeklyHours / 7).toFixed(1)}h`,
                                subtitle: "Average per day"
                              },
                              {
                                title: "Session Length",
                                value: `${avgSessionLength.toFixed(1)}h`,
                                subtitle: "Average session duration"
                              }
                            ];
                          })().map((stat, index) => (
                            <div key={index} className="text-center p-4 bg-muted/30 rounded-lg">
                              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                              <p className="text-2xl font-bold">{stat.value}</p>
                              <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* AI-Powered Plan Modal */}
      <PlanModal 
        open={showPlanModal}
        onClose={handleClosePlanModal}
        onSubmit={handleGenerateAIPlan}
        isLoading={isGeneratingPlan}
      />
    </div>
  )
}
