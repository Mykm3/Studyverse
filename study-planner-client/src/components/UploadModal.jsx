import React, { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { useSubjects } from '@/contexts/SubjectContext';
import api from "@/utils/api";
import { useToast } from "./ui/use-toast";
import { X, Upload, ArrowLeft, Check, Trash2, RefreshCw } from "lucide-react";

export default function UploadModal({ open, onClose, onFilesSelected, subjectId }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [removedFiles, setRemovedFiles] = useState([]);
  const [newSubject, setNewSubject] = useState(subjectId || "");
  const [matchedSubject, setMatchedSubject] = useState(null);
  const [originalSubject, setOriginalSubject] = useState("");
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef();
  const { subjects } = useSubjects();
  const { toast } = useToast();

  // Effect to handle body scroll lock when modal is open
  useEffect(() => {
    if (open) {
      // Lock scroll when modal opens
      document.body.style.overflow = 'hidden';
    } else {
      // Re-enable scroll when modal closes
      document.body.style.overflow = '';
    }
    
    // Cleanup function to ensure scroll is re-enabled if component unmounts
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    // Reset state when modal opens with a subjectId
    if (open) {
      if (subjectId) {
        setNewSubject(subjectId);
        setOriginalSubject(subjectId);
      }
      // Clear matched subject when opening the modal
      setMatchedSubject(null);
    }
  }, [open, subjectId]);

  if (!open) return null;

  // Normalize string for comparison (lowercase, remove extra spaces, hyphens, etc.)
  const normalizeString = (str) => {
    return str.toLowerCase()
      .replace(/[\s-_]+/g, '') // Remove spaces, hyphens, underscores
      .trim();
  };

  // Find similar subject based on normalized name comparison
  const findSimilarSubject = (inputSubject) => {
    if (!inputSubject || !subjects?.length) return null;
    
    const normalizedInput = normalizeString(inputSubject);
    
    // Skip if input is too short (less than 3 chars after normalization)
    if (normalizedInput.length < 3) return null;
    
    // First look for exact match after normalization
    const exactMatch = subjects.find(s => normalizeString(s.name) === normalizedInput);
    if (exactMatch) return exactMatch;
    
    // Then look for subjects that contain the input or vice versa
    const containsMatch = subjects.find(s => {
      const normalizedSubject = normalizeString(s.name);
      return normalizedSubject.includes(normalizedInput) || normalizedInput.includes(normalizedSubject);
    });
    
    return containsMatch || null;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };
  
  const validateFile = (file) => {
    const allowedTypes = [
      // Document formats
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // Media formats
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'video/mp4',
      'video/quicktime',
      // Image formats
      'image/jpeg',
      'image/png',
      'image/svg+xml',
      'image/gif',
      // Archive formats
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed'
    ];
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not supported`);
    }
    
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }
    
    return true;
  };

  const processFiles = (files) => {
    console.log('[UploadModal] Files selected:', files.map(f => ({ 
      name: f.name, 
      type: f.type, 
      size: f.size 
    })));

    try {
      // Validate each file
      const validFiles = [];
      files.forEach(file => {
        try {
          validateFile(file);
          validFiles.push(file);
        } catch (error) {
          console.error('[UploadModal] File validation error:', error);
          toast({
            title: "Invalid File",
            description: `${file.name}: ${error.message}`,
            variant: "destructive"
          });
        }
      });
      
      if (validFiles.length > 0) {
        setSelectedFiles([...selectedFiles, ...validFiles]);
        if (onFilesSelected) onFilesSelected(validFiles);
      }
    } catch (error) {
      console.error('[UploadModal] File processing error:', error);
      toast({
        title: "File Error",
        description: error.message,
        variant: "destructive"
      });
    }
    
    // Clear the input to allow selecting the same file again if needed
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const handleNewSubjectChange = (e) => {
    const value = e.target.value;
    setNewSubject(value);
    
    // Find similar subject as user types
    const similar = findSimilarSubject(value);
    setMatchedSubject(similar);
  };

  const acceptSuggestedSubject = () => {
    if (matchedSubject) {
      setOriginalSubject(newSubject); // Store original input for restoration
      setNewSubject(matchedSubject.name);
      setMatchedSubject(null);
      
      toast({
        title: "Subject Merged",
        description: `Using existing subject: ${matchedSubject.name}`,
      });
    }
  };

  const restoreOriginalSubject = () => {
    if (originalSubject) {
      setNewSubject(originalSubject);
      setOriginalSubject("");
      setMatchedSubject(findSimilarSubject(originalSubject));
    }
  };

  const removeFile = (index) => {
    const fileToRemove = selectedFiles[index];
    setRemovedFiles([...removedFiles, fileToRemove]);
    
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    
    toast({
      title: "File Removed",
      description: `Removed: ${fileToRemove.name}`,
    });
  };

  const restoreFile = (index) => {
    const fileToRestore = removedFiles[index];
    setSelectedFiles([...selectedFiles, fileToRestore]);
    
    const newRemovedFiles = [...removedFiles];
    newRemovedFiles.splice(index, 1);
    setRemovedFiles(newRemovedFiles);
    
    toast({
      title: "File Restored",
      description: `Restored: ${fileToRestore.name}`,
    });
  };

  const resetForm = () => {
    setSelectedFiles([]);
    setRemovedFiles([]);
    setTitle("");
    if (!subjectId) {
      setNewSubject("");
    }
    setMatchedSubject(null);
    setOriginalSubject("");
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0 || (!subjectId && !newSubject)) {
      console.log('[UploadModal] Upload validation failed:', { 
        hasFiles: selectedFiles.length > 0, 
        hasSubject: Boolean(subjectId || newSubject)
      });
      toast({
        title: "Upload Error",
        description: "Please select a file and provide a subject",
        variant: "destructive"
      });
      return;
    }

    // Use the given subject ID or the new subject name directly
    // We'll let the backend handle subjects (they're created automatically with notes)
    const subjectToUse = subjectId || newSubject;
    
    // Use provided title or file name if title is empty
    const titleToUse = title.trim() || selectedFiles[0].name;
    
    try {
      setIsUploading(true);
      console.log('[UploadModal] Starting file upload process:', {
        subject: subjectToUse,
        title: titleToUse,
        fileName: selectedFiles[0].name,
        fileType: selectedFiles[0].type,
        fileSize: selectedFiles[0].size
      });

      // Create form data for upload
      const formData = new FormData();
      formData.append('subject', subjectToUse);
      formData.append('title', titleToUse);
      formData.append('note', selectedFiles[0]);

      // Upload to server using api utility
      console.log('[UploadModal] Sending upload request to server...');
      const response = await api.upload(
        '/api/notes/upload',
        formData
      );

      console.log('[UploadModal] Raw upload response:', response);

      // Validate the response
      if (!response || !response.publicUrl) {
        console.error('[UploadModal] Invalid response from server:', response);
        throw new Error('No file URL received from server');
      }

      // Ensure HTTPS URL
      const fileUrl = response.publicUrl.replace('http://', 'https://');
      
      console.log('[UploadModal] Upload successful:', {
        ...response,
        fileUrl
      });

      // Verify the file is accessible
      try {
        console.log('[UploadModal] Verifying file URL:', fileUrl);
        const checkResponse = await fetch(fileUrl, { method: 'HEAD' });
        console.log('[UploadModal] File URL check response:', {
          status: checkResponse.status,
          ok: checkResponse.ok,
          headers: Object.fromEntries([...checkResponse.headers.entries()])
        });
        
        if (!checkResponse.ok) {
          console.warn('[UploadModal] File URL may not be accessible:', fileUrl);
        }
      } catch (error) {
        console.error('[UploadModal] Failed to verify file URL:', error);
      }

      toast({
        title: "Upload Successful",
        description: "Your note has been uploaded successfully!",
      });
    
      // Close the modal after submission
      resetForm();
      onClose();
    } catch (error) {
      console.error("[UploadModal] Upload error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Extract a user-friendly error message
      let errorMessage = "Failed to upload file. Please try again.";
      
      if (error.response?.data?.error) {
        // Use server-provided error message
        errorMessage = error.response.data.error;
      } else if (error.message.includes('file format')) {
        errorMessage = "This file format is not supported. Please try a different format.";
      } else if (error.message.includes('file size')) {
        errorMessage = "File is too large. Maximum size is 10MB.";
      }
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center overflow-auto"
      style={{
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl px-4 md:px-0 my-6">
        <Card
          className="modal-content w-full rounded-lg border border-primary/20 shadow-xl backdrop-blur-sm bg-card transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 text-foreground"
        >
          <CardHeader className="pb-2 pt-6">
            <CardTitle className="text-2xl font-bold flex items-center text-foreground">
              <span className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                📄
              </span>
              {subjectId 
                ? `Add Document to ${subjectId.replace(/-/g, ' ')}` 
                : "Add Document"}
            </CardTitle>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted/50 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </CardHeader>
          <CardContent>
            <div>
              {!subjectId && (
                <div className="mb-4">
                  <label htmlFor="new-subject" className="block text-sm font-medium mb-1">
                    Subject Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="new-subject"
                      className="w-full p-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter subject name"
                      value={newSubject}
                      onChange={handleNewSubjectChange}
                      required
                    />
                    {originalSubject && (
                      <button 
                        className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-primary"
                        onClick={restoreOriginalSubject}
                        title="Restore original input"
                      >
                        <RefreshCw size={16} />
                      </button>
                    )}
                    {newSubject && (
                      <button 
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-destructive"
                        onClick={() => setNewSubject("")}
                        title="Clear subject"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  {matchedSubject && (
                    <div className="mt-2 p-2 bg-primary/10 rounded-md border border-primary/20 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-muted-foreground">Similar subject found:</span>
                        <p className="text-sm font-medium text-primary">{matchedSubject.name}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-2 py-1 px-2 h-auto"
                        onClick={acceptSuggestedSubject}
                      >
                        <Check size={14} className="mr-1" /> Use this
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="document-title" className="block text-sm font-medium mb-1">
                  Document Title <span className="text-muted-foreground text-xs">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="document-title"
                    className="w-full p-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter document title or leave blank to use file name"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  {title && (
                    <button 
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-destructive"
                      onClick={() => setTitle("")}
                      title="Clear title"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-5">
                Upload documents to organize your study materials efficiently.
              </p>
              <div
                className={`upload-area ${dragActive ? "border-primary bg-primary/10" : "border-border"} rounded-lg p-10 flex flex-col items-center justify-center mb-5 transition-colors cursor-pointer hover:border-primary/50 bg-card/50`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current.click()}
              >
                <input
                  type="file"
                  className="hidden"
                  id="file-upload"
                  multiple
                  ref={inputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.txt,.md,.mp3,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.mp4,.zip,.wav"
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center select-none">
                  <Upload className="mb-3 text-primary" size={32} />
                  <span className="text-primary font-medium text-lg">Upload document</span>
                  <span className="text-sm text-muted-foreground">Drag and drop or <span className="underline">choose file</span> to upload</span>
                  <span className="text-xs text-muted-foreground/70 mt-2">
                    Supported file types: PDF, Office (Word, Excel, PowerPoint), Text, Images, Audio/Video, Archives
                  </span>
                </label>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="mb-4 bg-muted/30 rounded-lg p-4 border-subtle">
                  <h3 className="text-sm font-semibold mb-2 text-foreground">Selected files:</h3>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {selectedFiles.map((file, idx) => (
                      <li key={`file-${idx}`} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                        <div className="flex items-center">
                          <span className="w-4 h-4 flex items-center justify-center mr-2">📄</span>
                          <span className="truncate max-w-xs">{file.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground/70">
                            ({Math.round(file.size / 1024)} KB)
                          </span>
                        </div>
                        <button 
                          className="p-1 text-muted-foreground hover:text-destructive"
                          onClick={() => removeFile(idx)}
                          title="Remove file"
                        >
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {removedFiles.length > 0 && (
                <div className="mb-4 bg-muted/20 rounded-lg p-4 border-subtle">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-medium text-muted-foreground">Recently removed:</h3>
                    <button 
                      className="text-xs text-primary hover:text-primary/80"
                      onClick={() => {
                        setSelectedFiles([...selectedFiles, ...removedFiles]);
                        setRemovedFiles([]);
                      }}
                    >
                      Restore all
                    </button>
                  </div>
                  <ul className="text-xs text-muted-foreground/70 space-y-1">
                    {removedFiles.slice(0, 3).map((file, idx) => (
                      <li key={`removed-${idx}`} className="flex items-center justify-between py-1">
                        <div className="flex items-center">
                          <span className="w-4 h-4 flex items-center justify-center mr-2 opacity-50">📄</span>
                          <span className="truncate max-w-xs line-through">{file.name}</span>
                        </div>
                        <button 
                          className="p-1 text-muted-foreground hover:text-primary"
                          onClick={() => restoreFile(idx)}
                          title="Restore file"
                        >
                          <RefreshCw size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex justify-end mt-6">
                <Button 
                  variant="outline" 
                  className="mr-2 hover:bg-muted/80 border-border text-foreground"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button 
                  variant="outline" 
                  className="mr-2 hover:bg-destructive/10 border-destructive/30 text-destructive"
                  onClick={resetForm}
                  disabled={isUploading || (selectedFiles.length === 0 && removedFiles.length === 0 && !title && !newSubject)}
                >
                  Reset
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={isUploading || selectedFiles.length === 0 || (!subjectId && !newSubject)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground interactive-element"
                >
                  {isUploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 