import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { CalendarIcon, Clock, BookOpen, User, Download, ArrowLeft, Share2, Users, Timer } from 'lucide-react';
import { useToast } from '../lib/toast';
import { useAuth } from '../contexts/AuthContext';
import { useSubjects } from '../contexts/SubjectContext';
import Calendar from '../components/Calendar';
import { ImportPlanModal } from '../components/ImportPlanModal';
import api from '../utils/api';

// Fixed color palette for subjects (same as studyplan.jsx)
const SUBJECT_COLOR_PALETTE = [
  '#4361ee', '#3a0ca3', '#f72585', '#7209b7', '#4cc9f0', '#f94144', 
  '#06d6a0', '#ffbe0b', '#8338ec', '#3a86ff', '#ff006e', '#fb5607', 
  '#43aa8b', '#b5179e', '#ffb4a2'
];

function generateColorFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 85%, 50%)`;
}

function getSubjectColorMap(subjects) {
  const colorMap = {};
  const uniqueSubjects = Array.from(new Set(subjects));
  uniqueSubjects.forEach((subject, idx) => {
    if (idx < SUBJECT_COLOR_PALETTE.length) {
      colorMap[subject] = SUBJECT_COLOR_PALETTE[idx];
    } else {
      colorMap[subject] = generateColorFromString(subject);
    }
  });
  return colorMap;
}

export default function SharedPlan() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { subjects: userSubjects, fetchSubjects } = useSubjects();

  const [sharedPlan, setSharedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    fetchSharedPlan();
  }, [shareId]);

  useEffect(() => {
    if (user) {
      fetchSubjects();
    }
  }, [user, fetchSubjects]);

  const fetchSharedPlan = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/shared-plans/${shareId}`);
      
      if (response.success) {
        setSharedPlan(response.sharedPlan);
      } else {
        setError('Failed to load shared plan');
      }
    } catch (error) {
      console.error('Error fetching shared plan:', error);
      if (error.response?.status === 404) {
        setError('Shared plan not found');
      } else if (error.response?.status === 410) {
        setError('This shared plan has expired');
      } else {
        setError('Failed to load shared plan');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShowImportModal = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to save this plan to your account",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    setShowImportModal(true);
  };

  const handleImportPlan = async (importMode) => {
    try {
      const response = await api.post(`/api/shared-plans/${shareId}/save`, {
        importMode
      });

      if (response.success) {
        toast({
          title: "Plan Imported!",
          description: `Successfully ${importMode === 'replace' ? 'replaced your plan with' : 'merged'} ${response.importedSessions} sessions`,
        });
        navigate('/study-plan');
      }
    } catch (error) {
      console.error('Error importing plan:', error);
      throw error; // Re-throw to be handled by the modal
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Plan Not Available</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sharedPlan) {
    return null;
  }

  const subjectColorMap = getSubjectColorMap(sharedPlan.planData.subjects);
  
  // Convert sessions to calendar events
  const calendarEvents = sharedPlan.planData.sessions.map((session, index) => {
    const color = subjectColorMap[session.subject] || generateColorFromString(session.subject);
    return {
      id: `shared-${index}`,
      title: session.subject,
      start: session.startTime,
      end: session.endTime,
      backgroundColor: color,
      borderColor: color,
      textColor: '#ffffff',
      description: session.description || '',
      allDay: false,
      display: 'block',
      extendedProps: {
        description: session.description || '',
        status: 'shared',
        originalSession: session
      }
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Share2 className="h-6 w-6 text-primary" />
                {sharedPlan.title}
              </h1>
              <p className="text-muted-foreground">
                Shared by {sharedPlan.ownerName} • {sharedPlan.metadata.totalSessions} sessions
              </p>
            </div>
          </div>
          
          <Button onClick={handleShowImportModal}>
            <Download className="h-4 w-4 mr-2" />
            Import Plan
          </Button>
        </div>

        {/* Plan Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{sharedPlan.metadata.subjectCount}</div>
              <div className="text-sm text-muted-foreground">Subjects</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{sharedPlan.metadata.totalSessions}</div>
              <div className="text-sm text-muted-foreground">Sessions</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Timer className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{sharedPlan.metadata.totalHours.toFixed(1)}h</div>
              <div className="text-sm text-muted-foreground">Total Hours</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{sharedPlan.accessCount}</div>
              <div className="text-sm text-muted-foreground">Views</div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Study Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar 
              events={calendarEvents}
              onDateSelect={() => {}} // Disable date selection for shared plans
              key={calendarEvents.length}
            />
          </CardContent>
        </Card>

        {/* Subjects List */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Subjects Covered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {sharedPlan.planData.subjects.map((subject) => (
                <div 
                  key={subject}
                  className="flex items-center gap-2 p-2 rounded-lg border"
                >
                  <div 
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: subjectColorMap[subject] }}
                  />
                  <span className="text-sm font-medium">{subject}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Import Plan Modal */}
        <ImportPlanModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          sharedPlan={sharedPlan}
          userSubjects={userSubjects}
          onImport={handleImportPlan}
        />
      </div>
    </div>
  );
}
