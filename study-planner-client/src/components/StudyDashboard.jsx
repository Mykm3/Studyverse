import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Progress } from "@/components/ui/Progress"
import { Calendar, Clock, CheckCircle, TrendingUp, Award, Sparkles } from "lucide-react"
import NotificationDashboard from "@/components/NotificationDashboard"
import RecentNotes from "@/components/RecentNotes"
import { Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useState, useEffect } from "react"

export default function StudyDashboard() {
  const { user } = useAuth()
  const firstName = user?.displayName?.split(" ")[0] || "there"
  const [isLoading, setIsLoading] = useState(true)
  const [animate, setAnimate] = useState(false)
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false)
      setTimeout(() => setAnimate(true), 300)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Fetch sessions for dashboard
    const fetchSessions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/study-sessions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        if (!response.ok) return;
        const data = await response.json();
        setSessions(data);
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchSessions();
  }, []);

  // Helper functions for dashboard metrics
  const getWeeklyProgress = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of current week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999);

    const weekSessions = sessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
    });

    const completedSessions = weekSessions.filter(session => session.status === 'completed').length;
    const totalSessions = weekSessions.length;

    return { completed: completedSessions, total: totalSessions };
  };

  const getTodayStudyTime = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todaySessions = sessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= today && sessionDate < tomorrow && session.status === 'completed';
    });

    const totalMinutes = todaySessions.reduce((total, session) => {
      const start = new Date(session.startTime);
      const end = new Date(session.endTime);
      return total + (end - start) / (1000 * 60); // Convert to minutes
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return { hours, minutes, totalMinutes };
  };

  const getSessionCompletionStreak = () => {
    if (sessions.length === 0) return 0;

    // Sort sessions by start time (most recent first)
    const sortedSessions = [...sessions]
      .filter(session => session.status !== 'cancelled')
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    let streak = 0;
    for (const session of sortedSessions) {
      if (session.status === 'completed') {
        streak++;
      } else if (session.status === 'scheduled') {
        // Skip future sessions
        continue;
      } else {
        // Break streak if we find a missed session
        break;
      }
    }

    return streak;
  };

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
        </div>
      </div>

      {/* Session Completion Streak Banner */}
      <div
        className={`bg-gradient rounded-lg shadow-lg text-white p-4 flex items-center transition-all duration-500 transform ${
          isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        <CheckCircle className="h-10 w-10 mr-4" />
        <div className="flex-1">
          <h3 className="font-bold text-lg text-white">
            Session Completion Streak: {getSessionCompletionStreak()} sessions! ✅
          </h3>
          <p className="text-white">
            {getSessionCompletionStreak() > 0
              ? `${getSessionCompletionStreak()} planned sessions completed in a row. Keep it up!`
              : "Complete your next planned session to start a streak!"
            }
          </p>
        </div>
        <Link to="/study-plan?tab=review">
          <Button variant="default" size="sm" className="ml-auto bg-white/20 hover:bg-white/30">
            View Stats
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(() => {
          const todayStudyTime = getTodayStudyTime();
          const weeklyProgress = getWeeklyProgress();
          const sessionStreak = getSessionCompletionStreak();

          // Calculate daily goal progress (assuming 3 hours daily goal)
          const dailyGoalMinutes = 3 * 60; // 3 hours in minutes
          const todayProgress = Math.min((todayStudyTime.totalMinutes / dailyGoalMinutes) * 100, 100);

          // Calculate weekly progress percentage
          const weeklyProgressPercent = weeklyProgress.total > 0
            ? (weeklyProgress.completed / weeklyProgress.total) * 100
            : 0;

          return [
            {
              title: "Study Time Today",
              icon: <Clock className="h-6 w-6 text-primary/80" />,
              value: todayStudyTime.hours > 0 || todayStudyTime.minutes > 0
                ? `${todayStudyTime.hours}h ${todayStudyTime.minutes}m`
                : "0h 0m",
              progress: Math.round(todayProgress),
              description: `${Math.round(todayProgress)}% of daily goal`,
              color: "from-blue-500 to-indigo-500",
              delay: 100
            },
            {
              title: "Weekly Progress Tracker",
              icon: <CheckCircle className="h-6 w-6 text-success/80" />,
              value: `${weeklyProgress.completed} / ${weeklyProgress.total}`,
              progress: Math.round(weeklyProgressPercent),
              description: `${weeklyProgress.completed} sessions done this week`,
              color: "from-green-500 to-emerald-500",
              delay: 200
            },
            {
              title: "Session Completion Streak",
              icon: <TrendingUp className="h-6 w-6 text-warning/80" />,
              value: `${sessionStreak} sessions`,
              progress: sessionStreak > 0 ? 100 : 0,
              description: sessionStreak > 0 ? "Keep it up!" : "Start your streak!",
              color: "from-amber-500 to-orange-500",
              delay: 300
            }
          ];
        })().map((card, index) => (
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
        <NotificationDashboard sessions={sessions.filter(session => {
          if (!session.startTime) return false;
          const sessionDate = new Date(session.startTime);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return sessionDate.setHours(0, 0, 0, 0) === today.getTime();
        })} />
        <RecentNotes animate={animate} />
      </div>
    </div>
  )
}

