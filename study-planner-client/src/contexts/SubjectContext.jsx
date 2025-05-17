import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '@/utils/api';

// Initial subjects - empty array instead of hardcoded subjects
const initialSubjects = [];

const SubjectContext = createContext();

export function useSubjects() {
  return useContext(SubjectContext);
}

export function SubjectProvider({ children }) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchInProgress = useRef(false);
  const hasFetchedSubjects = useRef(false);

  // Memoize the fetchSubjects function to avoid recreation on each render
  const fetchSubjects = useCallback(async (forceRefresh = false) => {
    console.count('fetchSubjects called');
    
    // Skip if fetch already in progress to prevent duplicate calls
    if (fetchInProgress.current && !forceRefresh) {
      console.log('[SubjectContext] Fetch already in progress, skipping duplicate call');
      return;
    }
    
    // Skip if already fetched and not forced to refresh
    if (hasFetchedSubjects.current && !forceRefresh && subjects.length > 0) {
      console.log('[SubjectContext] Subjects already fetched, skipping fetch');
      return;
    }
    
    try {
      fetchInProgress.current = true;
      setLoading(true);
      console.log('[SubjectContext] Fetching subjects from API...');
      
      // Check if user is authenticated first
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('[SubjectContext] No authentication token found, using empty subjects list');
        setSubjects([]);
        setLoading(false);
        return;
      }
      
      const response = await api.get('/api/notes/subjects');
      console.log('[SubjectContext] Raw response:', response);
      
      // Handle different response structures
      let subjectsData = [];
      if (response && response.success === true && Array.isArray(response.data)) {
        // New API format with success field
        subjectsData = response.data;
        console.log('[SubjectContext] Using new API format with success field');
      } else if (Array.isArray(response)) {
        // Old API format (direct array)
        subjectsData = response;
        console.log('[SubjectContext] Using old API format (direct array)');
      } else if (response && Array.isArray(response.subjects)) {
        // Alternative format
        subjectsData = response.subjects;
        console.log('[SubjectContext] Using alternative API format with subjects field');
      } else {
        console.warn('[SubjectContext] Unexpected API response format:', response);
        // Default to empty array if response format is unexpected
        subjectsData = [];
      }
      
      console.log('[SubjectContext] Subjects fetched successfully:', subjectsData);
      setSubjects(subjectsData || []);
      hasFetchedSubjects.current = true;
      setError(null);
    } catch (err) {
      console.error('[SubjectContext] Error fetching subjects:', err);
      
      // Handle unauthorized errors by setting empty subjects list
      if (err.message && (err.message.includes('Unauthorized') || err.message.includes('401'))) {
        console.warn('[SubjectContext] Authentication error, using empty subjects list');
        setSubjects([]);
      } else if (err.message && err.message.includes('Internal Server Error')) {
        console.warn('[SubjectContext] Server error, using empty subjects list');
        setSubjects([]);
      }
      
      setError(err.message);
      // Don't clear subjects on error - keep existing data if any
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [subjects.length]);

  // Load subjects when the component mounts - only once
  useEffect(() => {
    // Only fetch if no subjects have been loaded yet
    if (!hasFetchedSubjects.current) {
      fetchSubjects();
    }
    
    // Include fetchSubjects in the dependency array
  }, [fetchSubjects]);

  // Add a new subject - will both add to local state and save to backend via upload
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
      
      // Note: We don't need to explicitly save to backend - 
      // subjects are created when notes are uploaded with that subject
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

  // Remove a subject - this is only a UI operation
  // Does not delete notes with this subject from the backend
  const removeSubject = (id) => {
    setSubjects((prev) => prev.filter((subject) => subject.id !== id));
  };

  // Clear all subjects from UI only
  // This doesn't delete any notes from the backend
  const clearAllSubjects = () => {
    setSubjects([]);
    return true;
  };

  const value = {
    subjects,
    loading,
    error,
    fetchSubjects,
    addSubject,
    updateSubject,
    removeSubject,
    clearAllSubjects,
  };

  return <SubjectContext.Provider value={value}>{children}</SubjectContext.Provider>;
} 