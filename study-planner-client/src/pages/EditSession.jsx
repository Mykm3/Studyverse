import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Calendar, Clock, Save, Trash, X, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { useSubjects } from '@/contexts/SubjectContext';

const EditSession = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    subject: '',
    startTime: '',
    endTime: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const { subjects } = useSubjects();

  // Fetch the session data on component mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        // If session data is passed via location state, use it
        if (location.state?.session) {
          const { subject, startTime, endTime, description } = location.state.session;
          setFormData({
            subject,
            startTime: formatDateTimeForInput(startTime),
            endTime: formatDateTimeForInput(endTime),
            description: description || ''
          });
          setIsLoading(false);
          return;
        }

        // Otherwise fetch from API
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/study-sessions/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch session');
        }

        const sessionData = await response.json();
        setFormData({
          subject: sessionData.subject,
          startTime: formatDateTimeForInput(sessionData.startTime),
          endTime: formatDateTimeForInput(sessionData.endTime),
          description: sessionData.description || ''
        });
      } catch (error) {
        console.error('Error fetching session:', error);
        toast({
          title: "Error",
          description: "Failed to load study session",
          variant: "destructive"
        });
        navigate('/study-plan');
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId, navigate, toast, location.state]);

  // Helper function to format datetime for input
  const formatDateTimeForInput = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate end time is after start time
    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      toast({
        title: "Invalid Time",
        description: "End time must be after start time",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/study-sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update session');
      }

      toast({
        title: "Success",
        description: "Study session updated successfully",
        variant: "default"
      });
      
      // Navigate back to study plan page
      navigate('/study-plan');
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: "Error",
        description: "Failed to update study session",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this study session?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/study-sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      toast({
        title: "Success",
        description: "Study session deleted successfully",
        variant: "default"
      });
      
      // Navigate back to study plan page
      navigate('/study-plan');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Failed to delete study session",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({
      ...prev,
      subject: value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Get color based on subject
  const getSubjectColor = (subject) => {
    const colors = {
      'Mathematics': 'bg-blue-500',
      'Physics': 'bg-pink-500',
      'Chemistry': 'bg-cyan-500',
      'Biology': 'bg-purple-500',
      'Computer Science': 'bg-blue-400'
    };
    return colors[subject] || 'bg-primary';
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/study-plan')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Study Plan
      </Button>

      <Card className="border shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-primary/80 to-primary/50 pb-8">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold text-white">Edit Study Session</CardTitle>
              <p className="text-white/70 mt-1">Update your study session details</p>
            </div>
            <Badge className={`${getSubjectColor(formData.subject)} text-white`}>
              {formData.subject || 'No Subject'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select 
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={(e) => handleChange(e)}
                required
              >
                {subjects.length > 0 ? (
                  subjects.map((subject) => (
                    <option key={subject.id} value={subject.name}>
                      {subject.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No subjects available</option>
                )}
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  Start Time
                </Label>
                <Input
                  type="datetime-local"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-primary" />
                  End Time
                </Label>
                <Input
                  type="datetime-local"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add details about this study session"
                className="min-h-[100px]"
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6 bg-muted/20">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting || isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
                Deleting...
              </>
            ) : (
              <>
                <Trash className="h-4 w-4 mr-2" />
                Delete Session
              </>
            )}
          </Button>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/study-plan')}
              disabled={isSubmitting || isDeleting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || isDeleting}
              className="bg-gradient-to-r from-primary to-blue-600 text-white hover:from-primary/90 hover:to-blue-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EditSession; 