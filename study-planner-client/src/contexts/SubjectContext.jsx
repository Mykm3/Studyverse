import { createContext, useContext, useState, useEffect } from 'react';

// Initial subjects from SubjectList
const initialSubjects = [
  {
    id: "graph-theory",
    name: "Graph Theory",
    color: "#4361ee",
    documents: [],
    documentsCount: 0,
    progress: 0
  },
  {
    id: "software-engineering",
    name: "Intro to software engineering",
    color: "#f72585",
    documents: [],
    documentsCount: 0,
    progress: 0
  },
  {
    id: "operating-system",
    name: "Operating system",
    color: "#7209b7",
    documents: [],
    documentsCount: 0,
    progress: 0
  },
  {
    id: "expert-system",
    name: "Expert system",
    color: "#4cc9f0",
    documents: [],
    documentsCount: 0,
    progress: 0
  },
  {
    id: "management",
    name: "Principle of management",
    color: "#06d6a0",
    documents: [],
    documentsCount: 0,
    progress: 0
  },
  {
    id: "information-system",
    name: "Information system",
    color: "#ffd166",
    documents: [],
    documentsCount: 0,
    progress: 0
  },
  {
    id: "data-communications",
    name: "Data Communications",
    color: "#ef476f",
    documents: [],
    documentsCount: 0,
    progress: 0
  },
];

const SubjectContext = createContext();

export function useSubjects() {
  return useContext(SubjectContext);
}

export function SubjectProvider({ children }) {
  // Try to load subjects from localStorage, fall back to initialSubjects
  const [subjects, setSubjects] = useState(() => {
    const savedSubjects = localStorage.getItem('subjects');
    if (savedSubjects) {
      // Process saved subjects to ensure they have all required properties
      const parsed = JSON.parse(savedSubjects);
      return parsed.map(subject => ({
        ...subject,
        documents: subject.documents || [],
        documentsCount: subject.documentsCount || 0,
        progress: subject.progress || 0
      }));
    }
    return initialSubjects;
  });

  // Save subjects to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('subjects', JSON.stringify(subjects));
  }, [subjects]);

  // Add a new subject
  const addSubject = (subject) => {
    // Check if subject with same id or name already exists
    const exists = subjects.some(
      (s) => s.id === subject.id || s.name.toLowerCase() === subject.name.toLowerCase()
    );

    if (!exists) {
      // Ensure the new subject has all required properties
      const newSubject = {
        ...subject,
        documents: subject.documents || [],
        documentsCount: subject.documentsCount || 0,
        progress: subject.progress || 0
      };
      setSubjects((prev) => [...prev, newSubject]);
      return true;
    }
    return false;
  };

  // Update an existing subject
  const updateSubject = (id, updatedSubject) => {
    setSubjects((prev) =>
      prev.map((subject) => (subject.id === id ? { ...subject, ...updatedSubject } : subject))
    );
  };

  // Remove a subject
  const removeSubject = (id) => {
    setSubjects((prev) => prev.filter((subject) => subject.id !== id));
  };

  const value = {
    subjects,
    addSubject,
    updateSubject,
    removeSubject,
  };

  return <SubjectContext.Provider value={value}>{children}</SubjectContext.Provider>;
} 