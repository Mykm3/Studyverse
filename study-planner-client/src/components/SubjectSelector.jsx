import { Button } from "./ui/Button";

export default function SubjectSelector({ subjects, selectedSubject, onSelectSubject }) {
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