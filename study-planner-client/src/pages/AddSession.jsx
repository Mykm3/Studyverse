import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Clock, Save, X, ArrowLeft, AlertTriangle } from 'lucide-react';
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
  const { subjects } = useSubjects(); // Get subjects from context
  
  const [formData, setFormData] = useState({
    subject: '',
    startTime: '',
    endTime: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
              <Label htmlFor="subject">Subject</Label>
              <Select 
                value={formData.subject} 
                onValueChange={handleSelectChange}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {hasSubjects ? (
                    subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.name}>
                        {subject.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-warning" />
                      No subjects available. Add subjects in Notebook.
                    </div>
                  )}
                </SelectContent>
              </Select>
              {!hasSubjects && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1 text-warning" />
                  Add subjects in the Notebook page to see them here
                </p>
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