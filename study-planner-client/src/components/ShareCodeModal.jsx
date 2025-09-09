import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "./ui/Dialog";
import { Button } from './ui/Button';
import { Share2, ArrowRight } from 'lucide-react';
import { useToast } from '../lib/toast';

export function ShareCodeModal({ isOpen, onClose }) {
  const [shareCode, setShareCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!shareCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a share code",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    // Navigate to the shared plan page
    try {
      navigate(`/shared-plan/${shareCode.trim().toUpperCase()}`);
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid share code format",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    // Convert to uppercase and limit to 8 characters
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setShareCode(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Enter Share Code
          </DialogTitle>
          <DialogDescription>
            Enter the 8-character code shared with you to view and import a study plan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="shareCode" className="text-sm font-medium">
              Share Code
            </label>
            <input
              id="shareCode"
              type="text"
              value={shareCode}
              onChange={handleCodeChange}
              placeholder="Enter 8-character code"
              className="w-full px-3 py-3 text-center text-xl font-mono tracking-wider border rounded-md bg-background font-bold"
              maxLength={8}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground text-center">
              Enter the 8-character code shared with you (e.g., ABC123XY)
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!shareCode.trim() || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading...
                </>
              ) : (
                <>
                  View Plan
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
