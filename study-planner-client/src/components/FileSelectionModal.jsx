import { useState, useEffect } from "react";
import { X, FileText, Clock, ExternalLink, Search } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { useToast } from "./ui/use-toast";
import { formatRelativeTime } from "../utils/dateUtils";
import api from "@/utils/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "./ui/Dialog";

export default function FileSelectionModal({ open, onClose, subject, onSelectFile }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (open && subject) {
      fetchFiles();
    }
    // Reset state when modal is closed
    if (!open) {
      setSelectedFile(null);
      setSearchQuery("");
    }
  }, [open, subject]);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/notes/by-subject/${encodeURIComponent(subject)}`);
      
      if (response && response.success && Array.isArray(response.data)) {
        setFiles(response.data);
      } else {
        setFiles([]);
        setError("No files found for this subject");
      }
    } catch (err) {
      console.error("Error fetching files:", err);
      setError("Failed to load files. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load files for this subject",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFile = (file) => {
    setSelectedFile(file);
  };

  const handleStartSession = () => {
    if (selectedFile) {
      onSelectFile(selectedFile);
    } else {
      toast({
        title: "No file selected",
        description: "Please select a file to continue",
        variant: "destructive"
      });
    }
  };

  const filteredFiles = files.filter(file => 
    file.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    switch(fileType?.toLowerCase()) {
      case 'pdf':
        return "📄";
      case 'doc':
      case 'docx':
        return "📝";
      case 'ppt':
      case 'pptx':
        return "📊";
      case 'xls':
      case 'xlsx':
        return "📈";
      default:
        return "📄";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose} size="3xl">
      <DialogContent className="p-0">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              Select Document for {subject}
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted/50 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="max-h-[50vh] overflow-y-auto mb-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => fetchFiles()}
                >
                  Try Again
                </Button>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? (
                  <p>No documents match your search</p>
                ) : (
                  <p>No documents found for this subject</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFiles.map((file) => (
                  <div
                    key={file._id}
                    className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                      selectedFile?._id === file._id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => handleSelectFile(file)}
                  >
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">
                        {getFileIcon(file.fileUrl?.split('.').pop())}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{file.title || file.fileName || "Untitled Document"}</h3>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>Added {formatRelativeTime(file.createdAt)}</span>
                        </div>
                      </div>
                      {file.publicUrl && (
                        <a
                          href={file.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary p-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleStartSession}
              disabled={!selectedFile}
            >
              Start Session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 