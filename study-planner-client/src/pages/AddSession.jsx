import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Clock, Save, X, ArrowLeft, AlertTriangle, RefreshCw, Search } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { useSubjects } from '@/contexts/SubjectContext';

const AddSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { subjects, loading: subjectsLoading, fetchSubjects } = useSubjects(); // Get subjects from context
  
  const [formData, setFormData] = useState({
    subject: '',
    startTime: '',
    endTime: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshingSubjects, setRefreshingSubjects] = useState(false);
  
  // Check if we have a pre-filled start time from the URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const startTimeParam = queryParams.get('startTime');
  
  // Set initial start time if provided in URL
  useEffect(() => {
    if (startTimeParam) {
      setFormData(prev => ({
        ...prev,
        startTime: startTimeParam
      }));
    }
  }, [startTimeParam]);
  
  // Fetch subjects on initial load and setup
  useEffect(() => {
    // Refresh subjects when component mounts to ensure latest data
    fetchSubjects();
  }, [fetchSubjects]);
  
  // Handle manual refresh of subjects
  const handleRefreshSubjects = useCallback(async () => {
    setRefreshingSubjects(true);
    try {
      await fetchSubjects(true); // Force refresh
      toast({
        title: "Subjects Updated",
        description: "Subject list has been refreshed",
      });
    } catch (error) {
      toast({
        title: "Error Refreshing Subjects",
        description: "Could not refresh subject list",
        variant: "destructive"
      });
    } finally {
      setRefreshingSubjects(false);
    }
  }, [fetchSubjects, toast]);

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
      const response = await fetch(`${apiUrl}/api/study-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const newSession = await response.json();
      toast({
        title: "Success",
        description: "Study session created successfully",
        variant: "default"
      });
      
      // Navigate back to study plan page
      navigate('/study-plan');
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to create study session",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
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

  // Check if subjects array is available
  const hasSubjects = Array.isArray(subjects) && subjects.length > 0;

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
          <CardTitle className="text-2xl font-bold text-white">Create New Study Session</CardTitle>
          <p className="text-white/70 mt-1">Schedule your next productive study time</p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="subject">Subject</Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2 text-xs"
                  onClick={handleRefreshSubjects}
                  disabled={refreshingSubjects}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${refreshingSubjects ? 'animate-spin' : ''}`} />
                  Refresh List
                </Button>
              </div>
              
              {subjectsLoading ? (
                <div className="flex items-center justify-center p-4 border border-border rounded-md bg-background">
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                  <span className="text-sm text-muted-foreground">Loading subjects...</span>
                </div>
              ) : (
                <div className="relative">
                  <Select
                    defaultValue={formData.subject}
                    onChange={(e) => handleSelectChange(e.target.value)}
                    name="subject"
                    required
                    className="w-full"
                  >
                    <option value="" disabled>
                      {hasSubjects ? "Select a subject" : "No subjects yet – create one in the Notebook tab"}
                    </option>
                    {hasSubjects && subjects.map((subject) => (
                      <option 
                        key={subject.id || subject._id} 
                        value={subject.name}
                      >
                        {subject.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              
              {!hasSubjects && !subjectsLoading && (
                <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 mt-2">
                  <p className="text-xs text-amber-800 flex items-start">
                    <AlertTriangle className="h-4 w-4 mr-2 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>
                      No subjects found. Upload documents in the Notebook page first to create subjects.
                      <Button 
                        type="button"
                        variant="link" 
                        size="sm" 
                        className="p-0 h-auto text-primary hover:text-primary/80 ml-1"
                        onClick={() => navigate('/notebook')}
                      >
                        Go to Notebook
                      </Button>
                    </span>
                  </p>
                </div>
              )}
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

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/study-plan')}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !hasSubjects}
                className="bg-gradient-to-r from-primary to-blue-600 text-white hover:from-primary/90 hover:to-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Session
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddSession; 