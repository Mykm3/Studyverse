import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card"
import { Button } from "../components/ui/Button"
import { Plus, FileText, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import { useState, useEffect } from "react"

export default function RecentNotes({ animate = false }) {
  const [notes, setNotes] = useState([]);
  const [appeared, setAppeared] = useState({});

  useEffect(() => {
    // Fetch the last 3 recently uploaded notes
    const fetchNotes = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/notes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        if (!response.ok) return;
        const data = await response.json();
        // Sort by createdAt descending and take the last 3
        const sorted = (data.data || data).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setNotes(sorted.slice(0, 3));
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchNotes();
  }, []);

  useEffect(() => {
    if (animate) {
      // Sequentially animate notes
      const timers = notes.map((note, index) => {
        return setTimeout(() => {
          setAppeared(prev => ({ ...prev, [note._id || note.id]: true }));
        }, index * 200 + 700);
      });
      return () => timers.forEach(timer => clearTimeout(timer));
    }
  }, [animate, notes]);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2 text-primary" />
          Recent Notes
        </CardTitle>
        <Link to="/notebook">
          <Button size="sm" variant="ghost">
            <Plus className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="mb-2">No recent notes found.</p>
            <Button as={Link} to="/notebook" variant="outline" size="sm">Upload Note</Button>
          </div>
        ) : (
          notes.map((note, idx) => (
            <Link
              key={note._id || note.id || idx}
              to={`/notebook/${note._id || note.id}`}
              className={`block border rounded-lg p-4 hover:border-primary/50 transition-colors mb-4 ${animate && !appeared[note._id || note.id] ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
              style={{ transitionDelay: `${idx * 200}ms` }}
            >
              <div className="flex justify-between">
                <h4 className="font-medium">{note.title || 'Untitled Note'}</h4>
                <span className="text-xs text-muted-foreground">{note.createdAt ? new Date(note.createdAt).toLocaleString() : ''}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {note.tags && note.tags.length > 0 && note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground"
                  >
                    {tag}
                  </span>
                ))}
                {note.subject && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {note.subject}
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  )
}

