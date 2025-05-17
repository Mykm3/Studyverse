import { Button } from "./ui/Button";

export default function SubjectSelector({ subjects, selectedSubject, onSelectSubject, loading }) {
  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!subjects || subjects.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">No subjects available</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {subjects.map((subject) => (
        <Button
          key={subject.id}
          variant={selectedSubject === subject.id ? "default" : "outline"}
          className={`w-full justify-start ${
            selectedSubject === subject.id ? "bg-primary hover:bg-primary/90" : ""
          }`}
          onClick={() => onSelectSubject(subject.id)}
        >
          {subject.name}
          {subject.id !== "all" && (
            <span className="ml-auto bg-background text-foreground text-xs py-0.5 px-2 rounded-full">
              {subject.documentsCount || 0}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
} 