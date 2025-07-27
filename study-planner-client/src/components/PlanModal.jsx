import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Label } from "./ui/Label";
import { Select } from "./ui/Select";
import { Badge } from "./ui/Badge";
import { X, Plus, BookOpen, Loader2 } from "lucide-react";
import { useSubjects } from "../contexts/SubjectContext";

export function PlanModal({ open, onClose, onSubmit, isLoading = false }) {
  const { subjects: availableSubjects, loading: subjectsLoading, fetchSubjects } = useSubjects();
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [hours, setHours] = useState(10);
  const [preference, setPreference] = useState("morning");
  const [weeks, setWeeks] = useState(12);
  const [goals, setGoals] = useState("");

  const [sessionLength, setSessionLength] = useState(60);
  const [breakLength, setBreakLength] = useState(15);
  const [preferredDays, setPreferredDays] = useState(["monday", "wednesday", "friday"]);

  const [focusAreas, setFocusAreas] = useState([]);
  const [examDates, setExamDates] = useState("");

  // Fetch subjects when modal opens
  useEffect(() => {
    if (open) {
      fetchSubjects();
    }
  }, [open, fetchSubjects]);

  const toggleSubject = (subjectName) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectName)
        ? prev.filter(s => s !== subjectName)
        : [...prev, subjectName]
    );
  };

  const handleSubmit = () => {
    if (selectedSubjects.length === 0) {
      alert("Please select at least one subject");
      return;
    }
    
    if (preferredDays.length === 0) {
      alert("Please select at least one preferred day");
      return;
    }
    
    onSubmit({
      subjects: selectedSubjects,
      hours,
      preference,
      weeks,
      goals,
      sessionLength,
      breakLength,
      preferredDays,

      focusAreas,
      examDates
    });
  };



  const toggleDay = (day) => {
    setPreferredDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const addFocusArea = () => {
    const newFocus = prompt("Enter a focus area (e.g., 'Algebra', 'Quantum Physics'):");
    if (newFocus && newFocus.trim() && !focusAreas.includes(newFocus.trim())) {
      setFocusAreas([...focusAreas, newFocus.trim()]);
    }
  };

  const removeFocusArea = (area) => {
    setFocusAreas(focusAreas.filter(f => f !== area));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate AI Study Plan</DialogTitle>
          <DialogDescription>
            Let AI create a personalized study schedule based on your preferences and goals.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Subjects */}
          <div className="space-y-2">
            <Label>Select Subjects from Your Notebook</Label>
            {subjectsLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : availableSubjects && availableSubjects.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {availableSubjects.map((subject) => (
                    <button
                      key={subject.id}
                      type="button"
                      onClick={() => toggleSubject(subject.name)}
                      className={`p-3 rounded-md border text-sm transition-colors flex items-center gap-2 ${
                        selectedSubjects.includes(subject.name)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:bg-muted'
                      }`}
                    >
                      <BookOpen className="h-4 w-4" />
                      <span className="truncate">{subject.name}</span>
                      <span className="ml-auto bg-background text-foreground text-xs py-0.5 px-2 rounded-full">
                        {subject.documentsCount || 0}
                      </span>
                    </button>
                  ))}
                </div>
                {selectedSubjects.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground mb-2">Selected subjects:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSubjects.map((subject, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {subject}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => toggleSubject(subject)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 border-2 border-dashed border-border rounded-md">
                <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">No subjects found</p>
                <p className="text-xs text-muted-foreground">
                  Upload documents in the Notebook page to create subjects first
                </p>
              </div>
            )}
          </div>

          {/* Weekly Hours */}
          <div className="space-y-2">
            <Label htmlFor="hours">Weekly Study Hours</Label>
            <Input
              id="hours"
              type="number"
              min="1"
              max="40"
              value={hours}
              onChange={(e) => setHours(parseInt(e.target.value) || 0)}
            />
          </div>

          {/* Time Preference */}
          <div className="space-y-2">
            <Label htmlFor="preference">Preferred Time of Day</Label>
            <Select value={preference} onChange={(e) => setPreference(e.target.value)}>
              <option value="morning">Morning (6 AM - 12 PM)</option>
              <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
              <option value="evening">Evening (5 PM - 9 PM)</option>
              <option value="night">Late Night (9 PM - 1 AM)</option>
              <option value="flexible">Flexible / Anytime</option>
            </Select>
          </div>



          {/* Session Length */}
          <div className="space-y-2">
            <Label htmlFor="sessionLength">How long should each study session last?</Label>
            <Select 
              value={sessionLength.toString()} 
              onChange={(e) => setSessionLength(parseInt(e.target.value))}
            >
              <option value="15">15 minutes</option>
              <option value="25">25 minutes (Pomodoro style)</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
            </Select>
          </div>

          {/* Break Length */}
          <div className="space-y-2">
            <Label htmlFor="breakLength">How long should your breaks be between sessions?</Label>
            <Select 
              value={breakLength.toString()} 
              onChange={(e) => setBreakLength(parseInt(e.target.value))}
            >
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="20">20 minutes</option>
              <option value="0">No breaks</option>
            </Select>
          </div>

          {/* Preferred Days */}
          <div className="space-y-2">
            <Label>Preferred Study Days</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "monday", label: "Monday" },
                { key: "tuesday", label: "Tuesday" },
                { key: "wednesday", label: "Wednesday" },
                { key: "thursday", label: "Thursday" },
                { key: "friday", label: "Friday" },
                { key: "saturday", label: "Saturday" },
                { key: "sunday", label: "Sunday" }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleDay(key)}
                  className={`p-2 rounded-md border text-sm transition-colors ${
                    preferredDays.includes(key)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:bg-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>



          {/* Focus Areas */}
          <div className="space-y-2">
            <Label>Specific Focus Areas (Optional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add specific topics or chapters..."
                value=""
                readOnly
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={addFocusArea}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {focusAreas.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {focusAreas.map((area, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {area}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeFocusArea(area)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Exam Dates */}
          <div className="space-y-2">
            <Label htmlFor="examDates">Important Dates (Optional)</Label>
            <Textarea
              id="examDates"
              placeholder="Enter exam dates, deadlines, or important events (e.g., 'Math Final: Dec 15, Physics Midterm: Nov 20')"
              value={examDates}
              onChange={(e) => setExamDates(e.target.value)}
              rows={2}
            />
          </div>

          {/* Weeks */}
          <div className="space-y-2">
            <Label htmlFor="weeks">Weeks Remaining in Semester</Label>
            <Input
              id="weeks"
              type="number"
              min="1"
              max="52"
              value={weeks}
              onChange={(e) => setWeeks(parseInt(e.target.value) || 0)}
            />
          </div>

          {/* Goals */}
          <div className="space-y-2">
            <Label htmlFor="goals">Learning Goals (Optional)</Label>
            <Textarea
              id="goals"
              placeholder="Describe your goals, exam dates, or specific topics you want to focus on..."
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || selectedSubjects.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                "Generate Plan"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 