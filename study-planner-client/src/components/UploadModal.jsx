import React, { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { useSubjects } from '@/contexts/SubjectContext';

export default function UploadModal({ open, onClose, onFilesSelected, subjectId }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [newSubject, setNewSubject] = useState(subjectId || "");
  const inputRef = useRef();
  const { addSubject } = useSubjects();

  if (!open) return null;

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
    setSelectedFiles(files);
    if (onFilesSelected) onFilesSelected(files);
  };
  
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    if (onFilesSelected) onFilesSelected(files);
  };

  const handleSubmit = () => {
    // For future implementation: Handle file upload to the backend
    if (newSubject && !subjectId) {
      // Add the new subject if it doesn't exist
      const subjectToAdd = {
        id: newSubject.toLowerCase().replace(/\s+/g, '-'),
        name: newSubject,
        color: getRandomColor(),
        documents: [],
        documentsCount: 0,
        progress: 0
      };
      
      const added = addSubject(subjectToAdd);
      if (added) {
        console.log("Added new subject:", subjectToAdd);
      }
    }
    
    console.log("Uploading files for subject:", subjectId || newSubject);
    console.log("Selected files:", selectedFiles);
    
    // Close the modal after submission
    setSelectedFiles([]);
    setNewSubject("");
    onClose();
  };
  
  const getRandomColor = () => {
    const colors = [
      "#4361ee", "#f72585", "#7209b7", "#4cc9f0", 
      "#06d6a0", "#ffd166", "#ef476f", "#118ab2"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleNewSubjectChange = (e) => {
    setNewSubject(e.target.value);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300"
      style={{
        background: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card
        className="w-full max-w-3xl rounded-lg border border-primary/20 shadow-xl backdrop-blur-sm bg-card/90 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 text-foreground"
      >
        <CardHeader className="pb-2 pt-6">
          <CardTitle className="text-2xl font-bold flex items-center text-foreground">
            <span className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mr-3">
              📄
            </span>
            Add Document
          </CardTitle>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </CardHeader>
        <CardContent>
          <div>
            <h2 className="text-lg font-medium mb-1 text-foreground">
              {subjectId ? (
                <span>Add document to <span className="text-primary">{subjectId.replace(/-/g, ' ')}</span></span>
              ) : (
                <div className="mb-4">
                  <label htmlFor="new-subject" className="block text-sm font-medium mb-1">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    id="new-subject"
                    className="w-full p-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter subject name"
                    value={newSubject}
                    onChange={handleNewSubjectChange}
                    required
                  />
                </div>
              )}
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Upload documents to organize your study materials efficiently.
            </p>
            <div
              className={`border-2 border-dashed ${dragActive ? "border-primary bg-primary/10" : "border-border"} rounded-lg p-10 flex flex-col items-center justify-center mb-5 transition-colors cursor-pointer hover:border-primary/50 bg-card/50`}
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
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center select-none">
                <span className="text-3xl mb-3">📄</span>
                <span className="text-primary font-medium text-lg">Upload document</span>
                <span className="text-sm text-muted-foreground">Drag and drop or <span className="underline">choose file</span> to upload</span>
                <span className="text-xs text-muted-foreground/70 mt-2">Supported file types: PDF, .txt, Markdown, Audio (e.g. mp3)</span>
              </label>
            </div>
            {selectedFiles.length > 0 && (
              <div className="mb-4 bg-muted/30 rounded-lg p-4 border border-border/50">
                <h3 className="text-sm font-semibold mb-2 text-foreground">Selected files:</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {selectedFiles.map((file, idx) => (
                    <li key={idx} className="flex items-center">
                      <span className="w-4 h-4 flex items-center justify-center mr-2">📄</span>
                      {file.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap gap-3 justify-center mb-2">
              <Button variant="outline" size="sm" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors border-border text-muted-foreground">Google Drive</Button>
              <Button variant="outline" size="sm" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors border-border text-muted-foreground">Google Docs</Button>
              <Button variant="outline" size="sm" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors border-border text-muted-foreground">Google Slides</Button>
              <Button variant="outline" size="sm" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors border-border text-muted-foreground">Link</Button>
              <Button variant="outline" size="sm" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors border-border text-muted-foreground">Paste text</Button>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button 
                variant="outline" 
                className="mr-2 hover:bg-muted/80 border-border text-foreground"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={selectedFiles.length === 0 || (!subjectId && !newSubject)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Upload
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 