import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from './Calendar';
import { Calendar as CalendarIcon, Clock, Plus, Target, Brain, Book, Award, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';

const StudyPlan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [studyPlan, setStudyPlan] = useState({
    title: 'My Study Plan',
    description: 'Weekly study schedule',
    weeklyGoal: 20,
    subjects: ['Mathematics', 'Physics', 'Chemistry'],
    sessions: []
  });

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    if (user) {
      fetchSessions();
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!loading) {
      // Start animations once data is loaded
      const timer = setTimeout(() => {
        setAnimate(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      console.log('Fetching sessions with token:', token.substring(0, 10) + '...');
      console.log('Making request to', `${apiUrl}/api/study-sessions`);
      
      const response = await fetch(`${apiUrl}/api/study-sessions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server response:', response.status, errorData);
        throw new Error(errorData.message || 'Failed to fetch sessions');
      }

      const data = await response.json();
      console.log('Received sessions:', data);
      setStudyPlan(prev => ({
        ...prev,
        sessions: data
      }));
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load study sessions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Convert study sessions to calendar events
    const calendarEvents = studyPlan.sessions.map(session => ({
      id: session._id,
      title: session.subject,
      start: new Date(session.startTime),
      end: new Date(session.endTime),
      backgroundColor: getSubjectColor(session.subject),
      borderColor: getSubjectColor(session.subject),
      textColor: '#ffffff',
      description: session.description
    }));
    setEvents(calendarEvents);
  }, [studyPlan.sessions]);

  const getSubjectColor = (subject) => {
    const colors = {
      'Mathematics': '#4361ee',
      'Physics': '#f72585',
      'Chemistry': '#4cc9f0',
      'Biology': '#7209b7',
      'Computer Science': '#3a86ff'
    };
    return colors[subject] || '#4361ee';
  };

  const handleEventClick = (event) => {
    // Handle event click - show details or edit form
    console.log('Event clicked:', event);
    toast({
      title: event.title,
      description: `${new Date(event.start).toLocaleTimeString()} - ${new Date(event.end).toLocaleTimeString()}`,
      variant: "default",
    });
  };

  const handleDateSelect = (selectInfo) => {
    // Handle date selection - show new session form
    console.log('Date selected:', selectInfo);
    // Navigate to add session with pre-filled date
    const startTime = selectInfo.startStr;
    navigate(`/add-session?startTime=${encodeURIComponent(startTime)}`);
  };

  const handleAddSession = () => {
    navigate('/add-session');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate stats
  const totalSessions = studyPlan.sessions.length;
  const totalHours = studyPlan.sessions.reduce((total, session) => {
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);
    return total + (end - start) / (1000 * 60 * 60);
  }, 0).toFixed(1);
  
  const hoursPerSubject = studyPlan.subjects.map(subject => {
    const subjectSessions = studyPlan.sessions.filter(session => session.subject === subject);
    const hours = subjectSessions.reduce((total, session) => {
      const start = new Date(session.startTime);
      const end = new Date(session.endTime);
      return total + (end - start) / (1000 * 60 * 60);
    }, 0).toFixed(1);
    return { subject, hours };
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 page-transition">
      {/* Header Section */}
      <div className={`bg-card rounded-lg shadow-lg p-6 transition-all duration-500 ${animate ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gradient flex items-center">
              <CalendarIcon className="mr-2 h-7 w-7" />
              {studyPlan.title}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {studyPlan.description}
            </p>
          </div>
          <Button 
            onClick={handleAddSession}
            variant="gradient"
            className="shadow-md"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Study Session
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-6 mt-4">
          <div className="flex items-center rounded-full bg-primary/10 px-3 py-1">
            <Target className="h-5 w-5 text-primary mr-2" />
            <span>Weekly Goal: <strong>{studyPlan.weeklyGoal} hours</strong></span>
          </div>
          
          <div className="flex items-center rounded-full bg-accent/10 px-3 py-1">
            <Clock className="h-5 w-5 text-accent-foreground mr-2" />
            <span>Total: <strong>{totalHours} hours</strong></span>
          </div>
          
          <div className="flex items-center rounded-full bg-success/10 px-3 py-1">
            <Book className="h-5 w-5 text-success mr-2" />
            <span>Subjects: <strong>{studyPlan.subjects.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className={`transition-all duration-500 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        style={{ transitionDelay: '100ms' }}>
      <Calendar
        events={events}
        onDateSelect={handleDateSelect}
      />
        </div>

      {/* Stats Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card 
          className={`hover-lift transition-all duration-500 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          style={{ transitionDelay: '200ms' }}
        >
            <CardHeader>
              <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5 text-primary" />
                Weekly Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
            <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Study Time</span>
                <span className="font-medium">{totalHours} hours</span>
                </div>
                <div className="flex justify-between">
                <span className="text-muted-foreground">Sessions Planned</span>
                <span className="font-medium">{totalSessions}</span>
                </div>
                <div className="flex justify-between">
                <span className="text-muted-foreground">Progress to Goal</span>
                <span className="font-medium">{Math.min(100, Math.round((totalHours / studyPlan.weeklyGoal) * 100))}%</span>
              </div>
              
              <div className="mt-4">
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent-foreground transition-all duration-1000"
                    style={{ 
                      width: animate ? `${Math.min(100, Math.round((totalHours / studyPlan.weeklyGoal) * 100))}%` : '0%',
                      transitionDelay: '500ms'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`hover-lift transition-all duration-500 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          style={{ transitionDelay: '300ms' }}
        >
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="mr-2 h-5 w-5 text-success" />
              Subject Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hoursPerSubject.map((item, index) => (
                <div key={item.subject} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm">{item.subject}</span>
                    <span className="text-sm font-medium">{item.hours}h</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ 
                        backgroundColor: getSubjectColor(item.subject),
                        width: animate ? `${Math.min(100, (item.hours / studyPlan.weeklyGoal) * 100)}%` : '0%',
                        transitionDelay: `${500 + index * 100}ms`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
              </div>
            </CardContent>
          </Card>

        <Card 
          className={`hover-lift transition-all duration-500 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          style={{ transitionDelay: '400ms' }}
        >
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="mr-2 h-5 w-5 text-warning" />
              Study Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-48">
              <div className="text-5xl font-bold text-gradient mb-2">7</div>
              <div className="text-xl font-medium mb-4">Days</div>
              <p className="text-center text-sm text-muted-foreground">
                You're on a roll! Keep studying daily to build your streak.
              </p>
        </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudyPlan; 