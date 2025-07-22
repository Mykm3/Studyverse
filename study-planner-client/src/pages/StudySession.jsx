import { StudySessionPage } from "@/components/StudySessionPage"
import { useLocation } from "react-router-dom"

export default function StudySession() {
  const location = useLocation();
  
  return (
    <main className="min-h-screen">
      <StudySessionPage location={location} />
    </main>
  )
} 