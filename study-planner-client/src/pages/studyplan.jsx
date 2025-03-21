import { Button } from "../components/ui/Button"
import { CalendarIcon, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import StudyCalendar from "../components/StudyCalendar"
import UpcomingSessions from "../components/UpcomingSessions"

export default function StudyPlanPage() {
  const currentMonth = "March 2025"

  return (
    <div
      className="h-screen"
      style={{ backgroundColor: "var(--background-color)", color: "var(--foreground-color)" }}
    >
      <main className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <CalendarIcon className="mr-2 h-6 w-6 text-primary" />
              Study Plan
            </h1>
            <p className="text-gray-500 dark:text-gray-400">Schedule and manage your study sessions</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Study Session
          </Button>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="outline" size="icon" className="mr-2">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-medium">{currentMonth}</h2>
            <Button variant="outline" size="icon" className="ml-2">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Today
            </Button>
            <Button variant="outline" size="sm">
              Week
            </Button>
            <Button variant="outline" size="sm" className="bg-primary/10">
              Month
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <StudyCalendar />
          </div>
          <div>
            <UpcomingSessions />
          </div>
        </div>
      </main>
    </div>
  )
}
