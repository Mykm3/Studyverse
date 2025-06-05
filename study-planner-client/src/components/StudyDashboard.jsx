import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Progress } from "@/components/ui/Progress"
import { Calendar, Clock, BookOpen, TrendingUp, Plus, Award, Sparkles } from "lucide-react"
import UpcomingStudySessions from "@/components/StudySuggestions"
import RecentNotes from "@/components/RecentNotes"
import { Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useState, useEffect } from "react"

export default function StudyDashboard() {
  const { user } = useAuth()
  const firstName = user?.displayName?.split(" ")[0] || "there"
  const [isLoading, setIsLoading] = useState(true)
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false)
      setTimeout(() => setAnimate(true), 300)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="p-6 space-y-6 page-transition">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient flex items-center">
            <Sparkles className="mr-2 h-7 w-7" />
            Welcome back, {firstName}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Here's an overview of your study progress</p>
        </div>
        <div className="flex space-x-2">
          <Link to="/study-plan">
            <Button variant="accent" size="sm" className="shadow-md">
              <Calendar className="mr-2 h-4 w-4" />
              View Calendar
            </Button>
          </Link>
          <Link to="/add-session">
            <Button variant="gradient" size="sm" className="shadow-md">
              <Plus className="mr-2 h-4 w-4" />
              New Study Session
            </Button>
          </Link>
        </div>
      </div>

      {/* Achievement Banner */}
      <div 
        className={`bg-gradient rounded-lg shadow-lg text-white p-4 flex items-center transition-all duration-500 transform ${
          isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        <Award className="h-10 w-10 mr-4" />
        <div className="flex-1">
          <h3 className="font-bold text-lg text-white">Study streak: 7 days!</h3>
          <p className="text-white">You're on a roll! Keep studying daily to maintain your streak.</p>
        </div>
        <Link to="/analytics">
          <Button variant="default" size="sm" className="ml-auto bg-white/20 hover:bg-white/30">
            View Stats
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: "Study Time Today",
            icon: <Clock className="h-6 w-6 text-primary/80" />,
            value: "2h 15m",
            progress: 75,
            description: "75% of daily goal",
            color: "from-blue-500 to-indigo-500",
            delay: 100
          },
          {
            title: "Topics Covered",
            icon: <BookOpen className="h-6 w-6 text-success/80" />,
            value: "12",
            progress: 60,
            description: "60% of weekly goal",
            color: "from-green-500 to-emerald-500",
            delay: 200
          },
          {
            title: "Learning Streak",
            icon: <TrendingUp className="h-6 w-6 text-warning/80" />,
            value: "7 days",
            progress: 100,
            description: "Keep it up!",
            color: "from-amber-500 to-orange-500",
            delay: 300
          }
        ].map((card, index) => (
          <Card 
            key={index} 
            className={`hover-lift border border-transparent hover:border-primary/20 transition-all duration-500 ${
              isLoading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            }`}
            style={{ transitionDelay: `${card.delay}ms` }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                {card.icon}
                <span className="text-2xl font-bold ml-2">{card.value}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 mt-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${card.color} transition-all duration-1000`}
                  style={{ 
                    width: animate ? `${card.progress}%` : '0%',
                    transitionDelay: `${card.delay + 200}ms`
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content: Upcoming Sessions and Recent Notes */}
      <div 
        className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-500 ${
          isLoading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
        style={{ transitionDelay: '400ms' }}
      >
        <UpcomingStudySessions animate={animate} />
        <RecentNotes animate={animate} />
      </div>
    </div>
  )
}

