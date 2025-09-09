import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "./ui/Dialog";
import { Button } from './ui/Button';
import { Copy, Share2, Check, Users, Clock, BookOpen } from 'lucide-react';
import { useToast } from '../lib/toast';

export function SharePlanModal({ isOpen, onClose, shareData, onCreateShare }) {
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const { toast } = useToast();

  const handleCreateShare = async () => {
    setIsCreatingShare(true);
    try {
      await onCreateShare();
    } catch (error) {
      console.error('Error creating share:', error);
      toast({
        title: "Error",
        description: "Failed to create shareable code",
        variant: "destructive"
      });
    } finally {
      setIsCreatingShare(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      toast({
        title: "Copied!",
        description: "Share code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share Study Plan
          </DialogTitle>
          <DialogDescription>
            Create a shareable code that others can use to view and import your study plan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!shareData ? (
            // Create share section
            <div className="text-center space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <Share2 className="h-12 w-12 text-primary mx-auto mb-2" />
                <h3 className="font-medium mb-2">Share Your Study Plan</h3>
                <p className="text-sm text-muted-foreground">
                  Create a shareable code that others can use to view and import your study plan.
                </p>
              </div>

              <Button
                onClick={handleCreateShare}
                disabled={isCreatingShare}
                className="w-full"
              >
                {isCreatingShare ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Share Code...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Create Share Code
                  </>
                )}
              </Button>
            </div>
          ) : (
            // Share created section
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                  <Check className="h-4 w-4" />
                  <span className="font-medium">Share Code Created!</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Your study plan is now shareable. Share this code with others so they can view and import your plan.
                </p>
              </div>

              {/* Plan Summary */}
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{shareData.metadata?.subjectCount || 0} subjects</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{shareData.metadata?.totalSessions || 0} sessions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{shareData.metadata?.totalHours?.toFixed(1) || 0}h</span>
                  </div>
                </div>
              </div>

              {/* Share Code */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-center block">Share Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareData.shareId}
                    readOnly
                    className="flex-1 px-3 py-3 text-sm border rounded-md bg-muted/50 font-mono text-center text-xl tracking-wider font-bold"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(shareData.shareId)}
                  >
                    {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Others can enter this code to access your plan
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              {shareData ? 'Done' : 'Cancel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
