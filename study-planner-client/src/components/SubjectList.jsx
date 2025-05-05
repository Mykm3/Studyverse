import { Card, CardContent } from "./ui/Card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/DropdownMenu";
import { Button } from "./ui/Button";
import { MoreVertical, Edit, Trash, Star, BookOpen, FileText, Plus } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/Accordion";
import { useState } from "react";
import UploadModal from "./UploadModal";
import { useSubjects } from '../contexts/SubjectContext';

export default function SubjectList() {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentSubject, setCurrentSubject] = useState("");
  
  // Get subjects from context
  const { subjects, updateSubject, removeSubject } = useSubjects();
  
  // State for document editing
  const [editingDoc, setEditingDoc] = useState(null);

  const handleAddDocument = (subjectId) => {
    setCurrentSubject(subjectId);
    setModalOpen(true);
  };
  
  // Function to toggle star status
  const toggleStar = (subjectId, docId) => {
    if (!subjects) return;
    
    const updatedSubjects = subjects.map(subject => {
      if (subject.id === subjectId && subject.documents) {
        const updatedDocs = subject.documents.map(doc => {
          if (doc.id === docId) {
            return { ...doc, starred: !doc.starred };
          }
          return doc;
        });
        return { ...subject, documents: updatedDocs };
      }
      return subject;
    });
    
    // Update the subject in context
    const updatedSubject = updatedSubjects.find(s => s.id === subjectId);
    if (updatedSubject) {
      updateSubject(subjectId, updatedSubject);
    }
  };
  
  // Function to delete a document
  const deleteDocument = (subjectId, docId) => {
    if (!subjects) return;
    
    if (window.confirm("Are you sure you want to delete this document?")) {
      const subject = subjects.find(s => s.id === subjectId);
      if (subject && subject.documents) {
        const updatedDocs = subject.documents.filter(doc => doc.id !== docId);
        const updatedSubject = { 
          ...subject, 
          documents: updatedDocs,
          documentsCount: (subject.documentsCount || 0) - 1 
        };
        updateSubject(subjectId, updatedSubject);
      }
    }
  };
  
  // Function to handle document edit
  const handleEdit = (subjectId, docId) => {
    if (!subjects) return;
    
    // Find the document to edit
    const subject = subjects.find(s => s.id === subjectId);
    const doc = subject?.documents?.find(d => d.id === docId);
    
    if (doc) {
      setEditingDoc({ subjectId, ...doc });
      // In a real app, this would open an edit modal or navigate to an edit page
      alert(`Editing ${doc.title} - This would open an edit form in a real application`);
    }
  };

  // Function to render progress indicator
  const renderProgressIndicator = (progress) => {
    // Determine color based on progress
    let color = "#22c55e"; // green-500
    let textColor = "text-green-600 dark:text-green-400";
    
    if (progress < 30) {
      color = "#ef4444"; // red-500
      textColor = "text-red-600 dark:text-red-400";
    } else if (progress < 70) {
      color = "#eab308"; // yellow-500
      textColor = "text-yellow-600 dark:text-yellow-400";
    }
    
    // Calculate SVG circle parameters
    const size = 24;
    const strokeWidth = 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    
    return (
      <div className="flex items-center gap-1">
        <span className={`text-xs font-medium ${textColor}`}>{progress}%</span>
        <div className="relative w-6 h-6 flex-shrink-0">
          {/* Background circle */}
          <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
            <circle 
              className="text-gray-200 dark:text-gray-700"
              strokeWidth={strokeWidth}
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx={size/2}
              cy={size/2}
            />
            {/* Progress circle */}
            <circle 
              className="transition-all duration-300 ease-in-out"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke={color}
              fill="transparent"
              r={radius}
              cx={size/2}
              cy={size/2}
              style={{ 
                transformOrigin: '50% 50%',
                transform: 'rotate(-90deg)',
              }}
            />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2 max-w-3xl mx-auto">
      <Accordion type="multiple">
        {subjects && subjects.length > 0 ? subjects.map((subject) => (
          <AccordionItem 
            key={subject.id} 
            value={subject.id} 
            className="hover:border-primary/50 transition-colors bg-card dark:border-border"
          >
            <AccordionTrigger 
              value={subject.id} 
              className="flex items-center p-3"
              style={{ borderLeft: `3px solid ${subject.color}` }}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 flex-shrink-0" style={{ color: subject.color }} />
                  <span className="font-medium text-base text-foreground">{subject.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground mr-1">{subject.documentsCount || 0} cards</span>
                  {renderProgressIndicator(subject.progress || 0)}
                </div>
              </div>
            </AccordionTrigger>
            
            <AccordionContent value={subject.id}>
              <div className="space-y-2 px-3 pb-2">
                <div className="flex justify-end p-1">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleAddDocument(subject.id)}
                    className="flex items-center gap-1"
                    style={{ color: subject.color, borderColor: `${subject.color}40` }}
                  >
                    <Plus className="h-3 w-3" />
                    Add Document
                  </Button>
                </div>
                
                {subject.documents && subject.documents.length > 0 ? (
                  <div className="grid gap-2">
                    {subject.documents.map((doc) => (
                      <Card 
                        key={doc.id} 
                        className="hover:border-primary/30 transition-colors bg-card dark:bg-card overflow-hidden"
                        style={{ borderLeft: `2px solid ${subject.color}` }}
                      >
                        <CardContent className="p-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 pr-2">
                              <div className="flex items-center">
                                <FileText className="h-3 w-3 mr-1.5 text-muted-foreground flex-shrink-0" style={{ color: subject.color }} />
                                <h3 className="font-medium text-sm text-foreground">{doc.title}</h3>
                                {doc.starred && (
                                  <Star className="ml-1.5 h-3 w-3 flex-shrink-0 fill-yellow-400 text-yellow-400" />
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">{doc.date}</span>
                                <div className="flex flex-wrap gap-1">
                                  {doc.tags && doc.tags.slice(0, 2).map((tag) => (
                                    <span
                                      key={tag}
                                      className="text-xs px-1.5 py-0.5 rounded-full"
                                      style={{ 
                                        backgroundColor: `${subject.color}15`,
                                        color: subject.color
                                      }}
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 rounded-full hover:bg-muted"
                                  >
                                    <MoreVertical className="h-3 w-3 text-muted-foreground" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 bg-card border-border">
                                  <DropdownMenuItem 
                                    onClick={() => handleEdit(subject.id, doc.id)}
                                    className="py-2 text-foreground"
                                  >
                                    <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>Edit</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => toggleStar(subject.id, doc.id)}
                                    className="py-2 text-foreground"
                                  >
                                    <Star 
                                      className={doc.starred 
                                        ? "text-yellow-400 fill-yellow-400 mr-2 h-4 w-4" 
                                        : "mr-2 h-4 w-4 text-muted-foreground"
                                      } 
                                    />
                                    <span>{doc.starred ? "Unstar" : "Star"}</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive py-2"
                                    onClick={() => deleteDocument(subject.id, doc.id)}
                                  >
                                    <Trash className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div 
                    className="text-center py-4 px-3 border border-dashed rounded-lg bg-muted/30"
                    style={{ borderColor: `${subject.color}40` }}
                  >
                    <FileText 
                      className="h-8 w-8 mx-auto mb-2 text-muted-foreground" 
                      style={{ color: `${subject.color}90` }}
                    />
                    <h3 className="text-sm font-medium mb-1 text-foreground">No documents yet</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Add your first document to this subject.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAddDocument(subject.id)}
                      className="flex items-center gap-1 mx-auto"
                      style={{ color: subject.color, borderColor: `${subject.color}40` }}
                    >
                      <Plus className="h-3 w-3" />
                      Add Document
                    </Button>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )) : (
          <div className="text-center py-8 px-4 border border-dashed rounded-lg">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2 text-foreground">No subjects yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first subject by clicking the "New Note" button.
            </p>
          </div>
        )}
      </Accordion>
      <UploadModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        subjectId={currentSubject}
      />
    </div>
  );
} 