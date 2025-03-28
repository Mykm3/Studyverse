import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from './Calendar';
import { Calendar as CalendarIcon, Clock, Plus } from 'lucide-react';
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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    if (user) {
      fetchSessions();
    }
  }, [user, authLoading, navigate]);

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
      'Mathematics': '#4a90e2',
      'Physics': '#e2844a',
      'Chemistry': '#4ae28d',
      'Biology': '#e24a4a',
      'Computer Science': '#4a4ae2'
    };
    return colors[subject] || '#4a90e2';
  };

  const handleEventClick = (event) => {
    // Handle event click - show details or edit form
    console.log('Event clicked:', event);
  };

  const handleDateSelect = (selectInfo) => {
    // Handle date selection - show new session form
    console.log('Date selected:', selectInfo);
  };

  const handleAddSession = () => {
    navigate('/add-session');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <div style={{
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px'
        }}>
          <div>
            <h1 style={{ 
              margin: '0 0 10px 0',
              fontSize: '24px',
              color: '#333'
            }}>
              {studyPlan.title}
            </h1>
            <p style={{ 
              margin: '0',
              color: '#666'
            }}>
              {studyPlan.description}
            </p>
          </div>
          <Button 
            onClick={handleAddSession}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#4a90e2',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <Plus size={16} />
            Add Study Session
          </Button>
        </div>
        <div style={{
          display: 'flex',
          gap: '20px',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CalendarIcon size={20} color="#666" />
            <span style={{ color: '#666' }}>
              Weekly Goal: {studyPlan.weeklyGoal} hours
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Clock size={20} color="#666" />
            <span style={{ color: '#666' }}>
              Subjects: {studyPlan.subjects.join(', ')}
            </span>
          </div>
        </div>
      </div>

      <Calendar
        events={events}
        onEventClick={handleEventClick}
        onDateSelect={handleDateSelect}
      />

      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold">Study Progress</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                Weekly Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Study Time</span>
                  <span className="font-medium">0 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sessions Completed</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Duration</span>
                  <span className="font-medium">0 minutes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudyPlan; 