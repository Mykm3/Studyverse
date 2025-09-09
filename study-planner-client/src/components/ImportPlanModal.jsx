import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "./ui/Dialog";
import { Button } from './ui/Button';
import { AlertTriangle, BookOpen, Users, Clock, Download, Replace, Merge } from 'lucide-react';
import { useToast } from '../lib/toast';

export function ImportPlanModal({ 
  isOpen, 
  onClose, 
  sharedPlan, 
  userSubjects = [], 
  onImport 
}) {
  const [importMode, setImportMode] = useState('merge'); // 'merge' or 'replace'
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  if (!sharedPlan) return null;

  // Find missing subjects
  const sharedSubjects = sharedPlan.planData.subjects || [];
  const missingSubjects = sharedSubjects.filter(
    subject => !userSubjects.some(userSubject => 
      userSubject.name?.toLowerCase() === subject.toLowerCase()
    )
  );

  const handleImport = async () => {
    setIsImporting(true);
    try {
      await onImport(importMode);
      onClose();
    } catch (error) {
      console.error('Error importing plan:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import the study plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Import Study Plan
          </DialogTitle>
          <DialogDescription>
            Choose how you'd like to import this study plan into your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Summary */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium mb-3">Plan Overview</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <BookOpen className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <div className="font-medium">{sharedPlan.metadata?.subjectCount || 0}</div>
                <div className="text-muted-foreground">Subjects</div>
              </div>
              <div className="text-center">
                <Users className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <div className="font-medium">{sharedPlan.metadata?.totalSessions || 0}</div>
                <div className="text-muted-foreground">Sessions</div>
              </div>
              <div className="text-center">
                <Clock className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <div className="font-medium">{sharedPlan.metadata?.totalHours?.toFixed(1) || 0}h</div>
                <div className="text-muted-foreground">Total Hours</div>
              </div>
            </div>
          </div>

          {/* Missing Subjects Warning */}
          {missingSubjects.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    Missing Subjects Detected
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                    The following subjects from this plan are not in your profile:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {missingSubjects.map((subject) => (
                      <span 
                        key={subject}
                        className="inline-block px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                    We've added them for you. Please upload notes if needed.
                  </p>
                  <button
                    onClick={() => window.open('/notebook', '_blank')}
                    className="text-yellow-700 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-200 text-xs font-medium underline mt-1"
                  >
                    Go to Notebook to upload notes →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Import Mode Selection */}
          <div className="space-y-3">
            <h3 className="font-medium">Import Options</h3>
            
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  name="importMode"
                  value="merge"
                  checked={importMode === 'merge'}
                  onChange={(e) => setImportMode(e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Merge className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Merge with Current Plan</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Add these sessions to your existing study plan. Your current sessions will be preserved.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={(e) => setImportMode(e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Replace className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Replace Current Plan</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Replace your entire study plan with this shared plan. Your current sessions will be removed.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleImport}
              disabled={isImporting}
              className="flex-1"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Import Plan
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
