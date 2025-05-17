import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { BarChart2, PieChart, Clock, Calendar, BookOpen, TrendingUp, Filter, ListFilter, Award } from "lucide-react";
import StudyHeatmap from "../components/StudyHeatmap";

// Mock data for the analytics page
const mockStudyData = {
  weeklyHours: [
    { day: "Mon", hours: 2.5 },
    { day: "Tue", hours: 1.8 },
    { day: "Wed", hours: 3.2 },
    { day: "Thu", hours: 2.0 },
    { day: "Fri", hours: 4.5 },
    { day: "Sat", hours: 3.7 },
    { day: "Sun", hours: 1.5 },
  ],
  subjectDistribution: [
    { subject: "Graph Theory", percentage: 35, hours: 7.5, color: "#4361ee" },
    { subject: "Software Engineering", percentage: 25, hours: 5.3, color: "#3a86ff" },
    { subject: "Operating Systems", percentage: 15, hours: 3.2, color: "#7209b7" },
    { subject: "Data Communications", percentage: 15, hours: 3.2, color: "#f72585" },
    { subject: "Other", percentage: 10, hours: 2.1, color: "#4cc9f0" },
  ],
  studyStreak: 12, // Days
  totalHoursThisWeek: 19.2,
  totalHoursLastWeek: 16.5,
  mostProductiveDay: "Friday",
  mostProductiveTimeOfDay: "Morning (8-11 AM)",
  highestFocusSubject: "Graph Theory",
};

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState("week"); // week, month, year
  const [isLoading, setIsLoading] = useState(true);
  const [animateCharts, setAnimateCharts] = useState(false);
  
  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => setAnimateCharts(true), 300);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Reset animation when timeframe changes
  useEffect(() => {
    setAnimateCharts(false);
    setIsLoading(true);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => setAnimateCharts(true), 300);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [timeframe]);

  // Calculate the percentage change
  const weeklyChange = Math.round(
    ((mockStudyData.totalHoursThisWeek - mockStudyData.totalHoursLastWeek) / 
    mockStudyData.totalHoursLastWeek) * 100
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden page-transition" style={{ backgroundColor: "var(--background-color)", color: "var(--foreground-color)" }}>
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center text-gradient">
                <BarChart2 className="mr-2 h-7 w-7" />
                Study Analytics
              </h1>
              <p className="text-gray-500 mt-1">Track your study habits and progress</p>
            </div>
            
            <div className="flex gap-2">
              <div className="flex p-1 bg-accent rounded-md shadow-sm">
                <Button 
                  variant={timeframe === "week" ? "accent" : "ghost"}
                  size="sm"
                  onClick={() => setTimeframe("week")}
                  className="rounded-md transition-all duration-300"
                >
                  Week
                </Button>
                <Button 
                  variant={timeframe === "month" ? "accent" : "ghost"}
                  size="sm"
                  onClick={() => setTimeframe("month")}
                  className="rounded-md transition-all duration-300"
                >
                  Month
                </Button>
                <Button 
                  variant={timeframe === "year" ? "accent" : "ghost"}
                  size="sm"
                  onClick={() => setTimeframe("year")}
                  className="rounded-md transition-all duration-300"
                >
                  Year
                </Button>
              </div>
            </div>
          </div>

          {/* Achievement Banner */}
          <div className={`bg-gradient p-4 rounded-lg shadow-lg text-white mb-6 transition-all duration-500 ${isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <div className="flex items-center">
              <Award className="h-10 w-10 mr-4" />
              <div>
                <h3 className="font-bold text-lg text-white">Consistency Champion!</h3>
                <p className="text-white">You've studied for 12 consecutive days. Keep up the great work!</p>
              </div>
              <Button variant="default" size="sm" className="ml-auto bg-white/20 hover:bg-white/30">
                View All Achievements
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Study Time This Week",
                value: `${mockStudyData.totalHoursThisWeek}h`,
                change: `${Math.abs(weeklyChange)}% from last week`,
                icon: <Clock className="h-10 w-10 text-primary/30" />,
                trend: weeklyChange >= 0 ? "up" : "down",
                delay: 0,
                color: "bg-gradient"
              },
              {
                title: "Current Streak",
                value: `${mockStudyData.studyStreak} days`,
                change: "Keep it up!",
                icon: <Calendar className="h-10 w-10 text-warning/30" />,
                delay: 100,
                color: "bg-warning text-warning-foreground"
              },
              {
                title: "Most Productive Day",
                value: mockStudyData.mostProductiveDay,
                change: `${mockStudyData.weeklyHours.find(d => d.day.startsWith(mockStudyData.mostProductiveDay.slice(0, 3)))?.hours}h studied`,
                icon: <TrendingUp className="h-10 w-10 text-success/30" />,
                delay: 200,
                color: "bg-success text-success-foreground"
              },
              {
                title: "Best Focus Time",
                value: "Morning",
                change: "8-11 AM",
                icon: <Clock className="h-10 w-10 text-accent-foreground/30" />,
                delay: 300,
                color: "bg-accent text-accent-foreground"
              }
            ].map((card, index) => (
              <Card 
                key={index} 
                className={`hover-lift transition-all duration-500 overflow-hidden ${isLoading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
                style={{ transitionDelay: `${card.delay}ms` }}
              >
                <div className={`${card.color} text-white p-4`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-white/80">{card.title}</p>
                      <h3 className="text-2xl font-bold mt-1 text-white">{card.value}</h3>
                      <p className={`text-xs mt-1 flex items-center text-white/80`}>
                        {card.trend && (
                          <span className="flex items-center">
                            {card.trend === "up" ? 
                              <TrendingUp className="h-3 w-3 mr-1" /> : 
                              <TrendingUp className="h-3 w-3 mr-1 transform rotate-180" />}
                          </span>
                        )}
                        {card.change}
                      </p>
                    </div>
                    {card.icon}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Hours Chart */}
            <Card className={`hover-lift transition-all duration-500 ${isLoading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`} style={{ transitionDelay: '400ms' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Study Hours by Day</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64 flex items-end justify-between gap-2 pt-8">
                  {mockStudyData.weeklyHours.map((day, index) => (
                    <div key={day.day} className="flex flex-col items-center gap-2 group">
                      <div className="relative w-12">
                        <div 
                          className="absolute bottom-0 w-full rounded-t-md transition-all duration-1000 opacity-80 group-hover:opacity-100"
                          style={{ 
                            height: animateCharts ? `${(day.hours / Math.max(...mockStudyData.weeklyHours.map(d => d.hours))) * 180}px` : '0px',
                            transitionDelay: `${index * 100}ms`,
                            background: 'linear-gradient(to top, var(--primary-color), var(--accent-foreground))'
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{day.day}</span>
                      <span className="text-xs text-gray-500">{day.hours}h</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Subject Distribution Chart */}
            <Card className={`hover-lift transition-all duration-500 ${isLoading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`} style={{ transitionDelay: '500ms' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Study Time by Subject</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-center mb-4">
                  <div className="relative h-52 w-52">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <defs>
                        <filter id="shadow">
                          <feDropShadow dx="0" dy="0" stdDeviation="2" floodOpacity="0.3"/>
                        </filter>
                      </defs>
                      {mockStudyData.subjectDistribution.map((subject, i) => {
                        // Calculate the pie segments
                        let previousAngle = 0;
                        for (let j = 0; j < i; j++) {
                          previousAngle += mockStudyData.subjectDistribution[j].percentage * 3.6; // 3.6 = 360/100
                        }
                        const angle = subject.percentage * 3.6;
                        const largeArcFlag = angle > 180 ? 1 : 0;
                        
                        // Starting point
                        const startX = 50 + 48 * Math.cos((previousAngle - 90) * Math.PI / 180);
                        const startY = 50 + 48 * Math.sin((previousAngle - 90) * Math.PI / 180);
                        
                        // End point
                        const endX = 50 + 48 * Math.cos(((previousAngle + angle) - 90) * Math.PI / 180);
                        const endY = 50 + 48 * Math.sin(((previousAngle + angle) - 90) * Math.PI / 180);

                        // Path with animation for each slice
                        const pathData = [
                          `M 50 50`,
                          `L ${startX} ${startY}`,
                          `A 48 48 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                          `Z`
                        ].join(' ');

                        return (
                          <path
                            key={subject.subject}
                            d={pathData}
                            fill={subject.color}
                            stroke="#fff"
                            strokeWidth="0.5"
                            filter="url(#shadow)"
                            style={{
                              opacity: animateCharts ? 1 : 0,
                              transform: animateCharts ? 'scale(1)' : 'scale(0.8)',
                              transformOrigin: 'center',
                              transition: 'all 0.5s ease-out',
                              transitionDelay: `${i * 100 + 200}ms`
                            }}
                          />
                        );
                      })}
                      <circle cx="50" cy="50" r="30" fill="white" filter="url(#shadow)" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-sm font-medium text-gray-500">Total</p>
                      <p className="text-2xl font-bold text-gradient">{mockStudyData.totalHoursThisWeek}h</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-2 mt-4">
                  {mockStudyData.subjectDistribution.map((subject, index) => (
                    <div 
                      key={subject.subject} 
                      className="flex items-center gap-2 transition-all duration-500 hover:translate-x-1" 
                      style={{ 
                        opacity: animateCharts ? 1 : 0,
                        transform: animateCharts ? 'translateX(0)' : 'translateX(-20px)',
                        transitionDelay: `${index * 100 + 600}ms`
                      }}
                    >
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: subject.color, boxShadow: `0 0 8px ${subject.color}` }}
                      ></div>
                      <div className="text-sm flex-1 truncate">{subject.subject}</div>
                      <div className="text-sm font-medium">{subject.percentage}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className={`lg:col-span-2 hover-lift transition-all duration-500 ${isLoading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`} style={{ transitionDelay: '600ms' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Study Efficiency</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {[
                    { subject: "Graph Theory", efficiency: 85, color: "from-indigo-500 to-blue-500" },
                    { subject: "Software Engineering", efficiency: 72, color: "from-blue-500 to-cyan-400" },
                    { subject: "Operating Systems", efficiency: 65, color: "from-purple-500 to-pink-500" },
                    { subject: "Data Communications", efficiency: 78, color: "from-pink-500 to-rose-500" }
                  ].map((item, index) => (
                    <div key={item.subject}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{item.subject}</span>
                        <span className="text-sm font-medium">{item.efficiency}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full progress-bar bg-gradient-to-r ${item.color}`}
                          style={{ 
                            width: animateCharts ? `${item.efficiency}%` : "0%",
                            transitionDelay: `${index * 200 + 800}ms`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className={`hover-lift transition-all duration-500 ${isLoading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`} style={{ transitionDelay: '700ms' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Study Tips</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {[
                    { text: "You study most effectively in the morning. Try to schedule more study sessions between 8-11 AM.", color: "border-l-blue-500 bg-blue-50" },
                    { text: `Your study streak is currently at ${mockStudyData.studyStreak} days! Keep it going to improve retention.`, color: "border-l-green-500 bg-green-50" },
                    { text: "You might want to increase your study time for Operating Systems, as it has the lowest efficiency score.", color: "border-l-amber-500 bg-amber-50" }
                  ].map((tip, index) => (
                    <div 
                      key={index} 
                      className={`border-l-4 ${tip.color} pl-3 py-2 rounded-r-md transition-all duration-500 hover:translate-x-1 hover:shadow-md`}
                      style={{ 
                        opacity: animateCharts ? 1 : 0,
                        transform: animateCharts ? 'translateX(0)' : 'translateX(20px)',
                        transitionDelay: `${index * 200 + 900}ms`
                      }}
                    >
                      <p className="text-sm">{tip.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Study Heatmap */}
          <div className={`transition-all duration-500 ${isLoading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`} style={{ transitionDelay: '800ms' }}>
            <StudyHeatmap animateIn={animateCharts} />
          </div>
        </div>
      </main>
    </div>
  );
} 