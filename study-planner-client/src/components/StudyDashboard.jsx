import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Progress } from "@/components/ui/Progress"
import { Calendar, Clock, BookOpen, TrendingUp, Plus } from "lucide-react"
import StudySuggestions from "@/components/StudySuggestions"
import RecentNotes from "@/components/RecentNotes"
import { Link } from "react-router-dom"

export default function StudyDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, John</h1>
          <p className="text-gray-500 dark:text-gray-400">Here's an overview of your study progress</p>
        </div>
        <div className="flex space-x-2">
          <Link to="/study-plan">
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              View Calendar
            </Button>
          </Link>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Study Session
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Study Time Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-primary mr-2" />
              <span className="text-2xl font-bold">2h 15m</span>
            </div>
            <Progress value={75} className="h-2 mt-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">75% of daily goal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Topics Covered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 text-primary mr-2" />
              <span className="text-2xl font-bold">12</span>
            </div>
            <Progress value={60} className="h-2 mt-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">60% of weekly goal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Learning Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-primary mr-2" />
              <span className="text-2xl font-bold">7 days</span>
            </div>
            <Progress value={100} className="h-2 mt-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Keep it up!</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StudySuggestions />
        <RecentNotes />
      </div>
    </div>
  )
}

