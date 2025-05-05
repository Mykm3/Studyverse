import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";

// Mock data for the heatmap
const generateMockHeatmapData = () => {
  const today = new Date();
  const data = [];
  
  // Generate data for the last 12 weeks (84 days)
  for (let i = 83; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Random study hours between 0-5, weighted to have more 0s and 1s
    let hours = 0;
    const rand = Math.random();
    if (rand > 0.4) hours = 1;
    if (rand > 0.7) hours = 2;
    if (rand > 0.85) hours = 3;
    if (rand > 0.93) hours = 4;
    if (rand > 0.97) hours = 5;
    
    // Make weekends more likely to have higher hours
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      hours = Math.min(5, hours + Math.floor(Math.random() * 2));
    }
    
    // Ensure current streak is reflected in the data
    if (i < 12) {
      hours = Math.max(1, hours);
    }
    
    data.push({
      date: date.toISOString().split('T')[0],
      hours: hours,
      level: hours === 0 ? 0 : Math.ceil(hours / 5 * 4),
    });
  }
  
  return data;
};

export default function StudyHeatmap({ animateIn = false }) {
  const [heatmapData] = useState(generateMockHeatmapData());
  const [animated, setAnimated] = useState(false);
  
  useEffect(() => {
    if (animateIn && !animated) {
      // Delay animation to allow parent component's animation to complete
      const timer = setTimeout(() => {
        setAnimated(true);
      }, 100);
      
      return () => clearTimeout(timer);
    } else if (!animateIn) {
      setAnimated(false);
    }
  }, [animateIn, animated]);
  
  // Group data by week
  const weeks = [];
  const daysInWeek = 7;
  
  for (let i = 0; i < heatmapData.length; i += daysInWeek) {
    weeks.push(heatmapData.slice(i, i + daysInWeek));
  }
  
  // Get day labels (Mon, Tue, etc.)
  const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];
  
  // Function to get color based on level - more vibrant colors
  const getLevelColor = (level) => {
    switch (level) {
      case 0: return "bg-gray-100";
      case 1: return "bg-blue-200";
      case 2: return "bg-blue-400";
      case 3: return "bg-indigo-500";
      case 4: return "bg-indigo-700";
      default: return "bg-gray-100";
    }
  };

  return (
    <Card className="bg-white hover-lift">
      <CardHeader className="pb-1 pt-3">
        <CardTitle className="text-sm font-medium flex items-center">
          <span className="text-gradient mr-2">Study Activity</span>
          <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">Last 12 weeks</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-2">
        <div className="flex mb-1">
          {dayLabels.map((day, i) => (
            <div key={i} className="flex-1 text-center text-xs text-gray-500">{day}</div>
          ))}
        </div>
        
        <div className="flex flex-col gap-[2px]">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex gap-[2px]">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`flex-1 aspect-square rounded-[2px] transition-all duration-500 ${getLevelColor(day.level)} ${animated ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                  style={{ 
                    transitionDelay: `${weekIndex * 20 + dayIndex * 20}ms`,
                    transform: animated ? 'scale(1)' : 'scale(0.5)',
                    boxShadow: day.level > 2 ? `0 0 4px rgba(99, 102, 241, ${day.level * 0.08})` : 'none',
                    minHeight: '8px',
                    maxHeight: '8px'
                  }}
                  title={`${day.date}: ${day.hours} hours studied`}
                ></div>
              ))}
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-end gap-1 mt-1.5">
          <div className="text-xs text-gray-500">Less</div>
          <div className="flex gap-[2px]">
            {[0, 1, 2, 3, 4].map((level) => (
              <div 
                key={level} 
                className={`w-2 h-2 rounded-[2px] transition-all duration-300 ${getLevelColor(level)} ${animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
                style={{ 
                  transitionDelay: `${1000 + level * 100}ms`,
                  boxShadow: level > 2 ? `0 0 4px rgba(99, 102, 241, ${level * 0.08})` : 'none'
                }}
              ></div>
            ))}
          </div>
          <div className="text-xs text-gray-500">More</div>
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
          <div className="flex gap-4">
            <div className="text-xs font-medium">Current: <span className="text-primary">12 days</span></div>
            <div className="text-xs font-medium">Longest: <span className="text-indigo-600">21 days</span></div>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient transition-all duration-1000"
                style={{ 
                  width: animated ? '57%' : '0%', 
                  transitionDelay: '1200ms' 
                }}
              ></div>
            </div>
            <span className="text-xs text-gray-500">57%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 