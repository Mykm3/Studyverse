import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "./ui/Dialog";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Label } from "./ui/Label";
import { Select } from "./ui/Select";
import { Badge } from "./ui/Badge";
import { X, BookOpen, Loader2 } from "lucide-react";
import { useSubjects } from "../contexts/SubjectContext";

export function PlanModal({ open, onClose, onSubmit, isLoading = false }) {
  const { subjects: availableSubjects, loading: subjectsLoading, fetchSubjects } = useSubjects();
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [subjectSessions, setSubjectSessions] = useState({}); // { subjectName: sessionsPerWeek }
  const [preference, setPreference] = useState("morning");
  const [weeks, setWeeks] = useState(4);
  const [sessionLength, setSessionLength] = useState(60);
  const [breakLength, setBreakLength] = useState(15);
  const [preferredDays, setPreferredDays] = useState(["monday", "wednesday", "friday"]);
  const [optionalNotes, setOptionalNotes] = useState("");

  // Session capacity validation constants
  const MAX_SESSIONS_PER_DAY = 3;

  useEffect(() => {
    if (open) fetchSubjects();
  }, [open, fetchSubjects]);

  // Calculate dynamic session capacity based on user choices
  const calculateMaxSessionsPerDay = () => {
    let maxSessions = 3; // Default maximum

    // Evening time constraint (6 PM - 10 PM = 4 hours)
    if (preference === "evening") {
      // Check if we can fit 3 sessions with current settings
      const totalTimeNeeded = (sessionLength * 3) + (breakLength * 2); // 3 sessions + 2 breaks
      const availableTime = 4 * 60; // 4 hours in minutes
      
      if (totalTimeNeeded <= availableTime) {
        maxSessions = 3; // Can fit 3 sessions
      } else {
        maxSessions = 2; // Can only fit 2 sessions
      }
    }

    // 90-minute sessions with longer breaks constraint
    if (sessionLength === 90 && breakLength > 5) {
      maxSessions = Math.min(maxSessions, 2);
    }

    return maxSessions;
  };

  // Calculate dynamic session limits based on available time slots
  const calculateSessionLimits = () => {
    const maxSessionsPerDay = calculateMaxSessionsPerDay();
    const totalSlots = preferredDays.length * maxSessionsPerDay * weeks;
    
    // Calculate base sessions per subject per week
    const baseSessionsPerSubject = selectedSubjects.length > 0 
      ? Math.floor(totalSlots / selectedSubjects.length / weeks)
      : 0;
    
    // Add buffer for flexibility (1-2 extra sessions if slots remain)
    const remainingSlots = totalSlots - (baseSessionsPerSubject * selectedSubjects.length * weeks);
    const buffer = Math.min(Math.floor(remainingSlots / selectedSubjects.length / weeks), 2);
    
    const maxSessionsPerSubject = Math.max(1, baseSessionsPerSubject + buffer);
    
    return {
      totalSlots,
      baseSessionsPerSubject,
      maxSessionsPerSubject,
      maxSessionsPerDay,
      remainingSlots,
      buffer
    };
  };

  // Calculate optimal break duration for maximum sessions
  const calculateOptimalBreakDuration = () => {
    if (preference === "evening") {
      const availableTime = 4 * 60; // 4 hours in minutes
      const sessionTime = sessionLength * 3; // 3 sessions
      const remainingTime = availableTime - sessionTime;
      const optimalBreak = Math.floor(remainingTime / 2); // 2 breaks needed
      
      return Math.max(5, optimalBreak); // Minimum 5 minutes
    }
    return breakLength; // No change for other time preferences
  };

  // Check if current settings reduce capacity and suggest optimizations
  const getCapacityWarnings = () => {
    const warnings = [];
    const optimalBreak = calculateOptimalBreakDuration();
    
    if (preference === "evening") {
      const totalTimeNeeded = (sessionLength * 3) + (breakLength * 2);
      const availableTime = 4 * 60;
      
      if (totalTimeNeeded > availableTime) {
        if (breakLength > optimalBreak) {
          warnings.push(`💡 Evening time: Reduce breaks to ${optimalBreak} minutes to fit 3 sessions (instead of ${breakLength} min)`);
        } else if (sessionLength > 60) {
          warnings.push(`💡 Evening time: Use 60-minute sessions to fit 3 sessions (instead of ${sessionLength} min)`);
        }
      }
    }
    
    if (sessionLength === 90 && breakLength > 5) {
      warnings.push(`💡 90-minute sessions: Use 5-minute breaks to fit 3 sessions (instead of ${breakLength} min)`);
    }
    
    return warnings;
  };

  // Calculate session capacity validation
  const validateSessionCapacity = () => {
    const sessionLimits = calculateSessionLimits();
    const requiredSessions = Object.values(subjectSessions).reduce((sum, sessions) => sum + sessions, 0);
    const weeklySessions = requiredSessions * weeks;
    const totalAvailableSlots = sessionLimits.totalSlots;
    
    // Generate specific warning messages based on constraints
    let constraintMessage = null;
    if (preference === "evening") {
      const totalTimeNeeded = (sessionLength * 3) + (breakLength * 2);
      const availableTime = 4 * 60;
      if (totalTimeNeeded > availableTime) {
        constraintMessage = `Evening time (6 PM – 10 PM) allows only ${sessionLimits.maxSessionsPerDay} study sessions per day with current settings`;
      } else {
        constraintMessage = "Evening time (6 PM – 10 PM) allows 3 study sessions per day";
      }
    } else if (sessionLength === 90 && breakLength > 5) {
      constraintMessage = "90-minute sessions with longer breaks reduce your daily capacity to 2 sessions";
    }
    
    return {
      requiredSessions,
      weeklySessions,
      totalAvailableSlots,
      maxSessionsPerDay: sessionLimits.maxSessionsPerDay,
      recommendedMaxPerSubject: sessionLimits.maxSessionsPerSubject,
      isValid: weeklySessions <= totalAvailableSlots,
      constraintMessage,
      message: weeklySessions > totalAvailableSlots 
        ? `You've selected ${weeklySessions} total sessions over ${weeks} weeks, but only have ${totalAvailableSlots} time slots available. ${constraintMessage ? constraintMessage + '. ' : ''}Reduce sessions per subject or add more study days.`
        : null
    };
  };

  const capacityValidation = validateSessionCapacity();

  const toggleSubject = (subjectName) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(subjectName)) {
        // Remove subject and its sessions
        const newSubjects = prev.filter((s) => s !== subjectName);
        const newSessions = { ...subjectSessions };
        delete newSessions[subjectName];
        setSubjectSessions(newSessions);
        return newSubjects;
      } else {
        // Check if we're at the 6-subject limit
        if (prev.length >= 6) {
          alert("Maximum 6 subjects allowed. Remove a subject to add another.");
          return prev;
        }
        // Add subject with default 1 session per week
        setSubjectSessions(prev => ({ ...prev, [subjectName]: 1 }));
        return [...prev, subjectName];
      }
    });
  };

  const updateSubjectSessions = (subjectName, sessionsPerWeek) => {
    // Check if this change would exceed total available slots
    const newSessions = { ...subjectSessions, [subjectName]: sessionsPerWeek };
    const totalSelectedSessions = Object.values(newSessions).reduce((sum, sessions) => sum + sessions, 0);
    const sessionLimits = calculateSessionLimits();
    
    if (totalSelectedSessions * weeks > sessionLimits.totalSlots) {
      // Don't update if it would exceed capacity
      return;
    }
    
    setSubjectSessions(newSessions);
  };

  const toggleDay = (day) => {
    setPreferredDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = () => {
    if (selectedSubjects.length === 0) return alert("Please select at least one subject");
    if (selectedSubjects.length > 6) return alert("Maximum 6 subjects allowed for optimal performance");
    if (preferredDays.length === 0) return alert("Please select at least one preferred day");
    if (weeks > 4) return alert("Maximum 4 weeks allowed for optimal performance");
    if (!capacityValidation.isValid) return alert(capacityValidation.message);

    onSubmit({
      subjects: selectedSubjects,
      subjectSessions, // Include sessions per subject
      preference,
      weeks,
      sessionLength,
      breakLength,
      preferredDays,
      optionalNotes
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose} size="lg">
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate AI Study Plan</DialogTitle>
          <DialogDescription>
            Create a personalized study schedule with essential inputs only. Study plans are
            generated using Gemini 2.5 Pro. Chat, summaries, and quizzes use Groq's LLaMA3-70B.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Length - Moved to first */}
          <div className="space-y-2">
            <Label htmlFor="sessionLength">How long should each study session be?</Label>
            <Select value={sessionLength.toString()} onChange={(e) => setSessionLength(parseInt(e.target.value))}>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
            </Select>
            <p className="text-xs text-muted-foreground">
              Shorter sessions = more breaks, longer sessions = fewer study blocks
            </p>
          </div>

          {/* Subjects */}
          <div className="space-y-2">
            <Label>Which subjects do you want to study? (Max 6)</Label>
            {subjectsLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : availableSubjects && availableSubjects.length > 0 ? (
              <div className="space-y-3">
                {selectedSubjects.length >= 6 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    ⚠️ Maximum 6 subjects reached. Remove a subject to add another.
                  </p>
                )}
                <div className="grid grid-cols-1 gap-2">
                  {availableSubjects.map((subject) => (
                    <div
                      key={subject.id}
                      className={`p-3 rounded-md border text-sm transition-colors ${
                        selectedSubjects.includes(subject.name)
                          ? "bg-primary/10 border-primary"
                          : "bg-background border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleSubject(subject.name)}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              selectedSubjects.includes(subject.name)
                                ? "bg-primary border-primary"
                                : "border-border"
                            }`}
                          >
                            {selectedSubjects.includes(subject.name) && (
                              <div className="w-2 h-2 bg-white rounded-sm"></div>
                            )}
                          </button>
                          <BookOpen className="h-4 w-4" />
                          <span className="truncate">{subject.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({subject.documentsCount || 0} docs)
                          </span>
                        </div>
                                                {selectedSubjects.includes(subject.name) && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">sessions/week:</span>
                            <Select
                              value={subjectSessions[subject.name]?.toString() || "1"}
                              onChange={(e) => updateSubjectSessions(subject.name, parseInt(e.target.value))}
                              className="w-16 h-6 text-xs"
                            >
                              {(() => {
                                const sessionLimits = calculateSessionLimits();
                                const maxOptions = Math.min(sessionLimits.maxSessionsPerSubject, 6); // Cap at 6 for UI
                                return Array.from({ length: maxOptions }, (_, i) => i + 1).map(num => (
                                  <option key={num} value={num}>{num}</option>
                                ));
                              })()}
                            </Select>
                            {(() => {
                              const currentSessions = subjectSessions[subject.name] || 1;
                              const sessionLimits = calculateSessionLimits();
                              const isNearLimit = currentSessions >= sessionLimits.maxSessionsPerSubject - 1;
                              return isNearLimit ? (
                                <span className="text-xs text-amber-600 dark:text-amber-400">⚠️</span>
                              ) : null;
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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

          {/* Time Preference */}
          <div className="space-y-2">
            <Label htmlFor="preference">What time of day works best?</Label>
            <Select value={preference} onChange={(e) => setPreference(e.target.value)}>
              <option value="morning">Morning (6 AM – 12 PM)</option>
              <option value="afternoon">Afternoon (12 PM – 6 PM)</option>
              <option value="evening">Evening (6 PM – 10 PM)</option>
              <option value="flexible">Flexible (Any time slot is fine)</option>
            </Select>
            {preference === "evening" && (() => {
              const totalTimeNeeded = (sessionLength * 3) + (breakLength * 2);
              const availableTime = 4 * 60;
              const canFit3 = totalTimeNeeded <= availableTime;
              
              return (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⏰ Evening time (6 PM - 10 PM): {canFit3 ? "3 sessions possible" : "Only 2 sessions possible"} with current settings
                </p>
              );
            })()}
          </div>

          {/* Break Length */}
          <div className="space-y-2">
            <Label htmlFor="breakLength">How long should your breaks be?</Label>
            <Select value={breakLength.toString()} onChange={(e) => setBreakLength(parseInt(e.target.value))}>
              <option value="5">5 min</option>
              <option value="10">10 min</option>
              <option value="15">15 min</option>
              <option value="20">20 min</option>
            </Select>
            {(() => {
              const warnings = getCapacityWarnings();
              return warnings.length > 0 ? (
                <div className="space-y-1">
                  {warnings.map((warning, index) => (
                    <p key={index} className="text-xs text-blue-600 dark:text-blue-400">
                      {warning}
                    </p>
                  ))}
                </div>
              ) : null;
            })()}
          </div>

          {/* Preferred Days */}
          <div className="space-y-2">
            <Label>Which days can you study?</Label>
            <div className="grid grid-cols-2 gap-2">
              {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`p-2 rounded-md border text-sm transition-colors ${
                    preferredDays.includes(day)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-muted"
                  }`}
                >
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </button>
              ))}
            </div>
            {preferredDays.length < 3 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Fewer than 3 days may limit the flexibility of your schedule.
              </p>
            )}
          </div>

          {/* Optional Notes */}
          <div className="space-y-2">
            <Label htmlFor="optionalNotes">Optional Notes or Topics</Label>
            <Textarea
              id="optionalNotes"
              placeholder="e.g., 'Compilers Ch. 3–4, IS test on Aug 12'"
              value={optionalNotes}
              onChange={(e) => setOptionalNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Weeks */}
          <div className="space-y-2">
            <Label htmlFor="weeks">📆 How many weeks should this plan cover?</Label>
                          <Input
                id="weeks"
                type="number"
                min="1"
                max="4"
                value={weeks}
                onChange={(e) => setWeeks(parseInt(e.target.value) || 0)}
              />
            <p className="text-xs text-muted-foreground">
              Maximum 4 weeks recommended. Plans are generated weekly for accuracy.
            </p>
          </div>

          {/* Live Summary */}
          {selectedSubjects.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">🧾 Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Study Plan: <span className="font-medium">{weeks} weeks</span></div>
                <div>Subjects: <span className="font-medium">{selectedSubjects.length} total</span></div>
                <div>Available Days: <span className="font-medium">{preferredDays.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(", ")}</span></div>
                <div>Time of Day: <span className="font-medium">{preference.charAt(0).toUpperCase() + preference.slice(1)}</span></div>
                <div>Session Length: <span className="font-medium">{sessionLength} mins</span></div>
                <div>Breaks: <span className="font-medium">{breakLength} mins</span></div>
                <div>Total Sessions: <span className="font-medium">{capacityValidation.requiredSessions}/week</span></div>
                <div>Total Study Time: <span className="font-medium">{((capacityValidation.requiredSessions * sessionLength) / 60).toFixed(1)} hrs/week</span></div>
              </div>
              
              {/* Session Capacity Info */}
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>📊 Total slots: <span className="font-medium">{capacityValidation.totalAvailableSlots}</span></div>
                  <div>🧠 Required: <span className="font-medium">{capacityValidation.weeklySessions}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>📅 Per day: <span className="font-medium">{capacityValidation.maxSessionsPerDay} sessions</span></div>
                  <div>📚 Per subject: <span className="font-medium">≤{capacityValidation.recommendedMaxPerSubject}/week</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>🎯 Base per subject: <span className="font-medium">{calculateSessionLimits().baseSessionsPerSubject}/week</span></div>
                  <div>🔄 Buffer: <span className="font-medium">+{calculateSessionLimits().buffer} sessions</span></div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {preferredDays.length} days × {capacityValidation.maxSessionsPerDay} sessions/day × {weeks} weeks = {capacityValidation.totalAvailableSlots} total slots
                </div>
                {capacityValidation.constraintMessage && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    ⏰ {capacityValidation.constraintMessage}
                  </div>
                )}
                {(() => {
                  const warnings = getCapacityWarnings();
                  const sessionLimits = calculateSessionLimits();
                  const totalSelectedSessions = Object.values(subjectSessions).reduce((sum, sessions) => sum + sessions, 0);
                  const totalSessionsOverWeeks = totalSelectedSessions * weeks;
                  const capacityUsage = (totalSessionsOverWeeks / sessionLimits.totalSlots) * 100;
                  
                  const allWarnings = [...warnings];
                  
                  // Add capacity warning if approaching limit
                  if (capacityUsage > 90) {
                    allWarnings.push(`⚠️ High capacity usage: ${capacityUsage.toFixed(0)}% of available slots`);
                  } else if (capacityUsage > 80) {
                    allWarnings.push(`💡 Moderate capacity usage: ${capacityUsage.toFixed(0)}% of available slots`);
                  }
                  
                  return allWarnings.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        💡 Optimization Suggestions:
                      </div>
                      {allWarnings.map((warning, index) => (
                        <div key={index} className="text-xs text-blue-600 dark:text-blue-400">
                          {warning}
                        </div>
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>
              
              {/* Validation warnings */}
              {(() => {
                const warnings = [];
                
                if (preferredDays.length < 3) {
                  warnings.push("⚠️ Fewer than 3 days may limit schedule flexibility");
                }
                
                if (!capacityValidation.isValid) {
                  warnings.push(`❌ ${capacityValidation.message}`);
                }
                
                return warnings.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {warnings.map((warning, index) => (
                      <p key={index} className={`text-xs ${warning.startsWith('❌') ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {warning}
                      </p>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading || selectedSubjects.length === 0 || !capacityValidation.isValid}>
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
