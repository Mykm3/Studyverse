import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Calendar, Clock, Plus } from "lucide-react";
import { showToast } from "@/components/ui/Toaster";

export default function StudyPlan() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [studySessions, setStudySessions] = useState([]);

  const handleAddSession = () => {
    // TODO: Implement add session functionality
    showToast("Add session functionality coming soon!", "default");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Study Plan</h1>
          <p className="text-muted-foreground">
            Manage your study schedule and track your progress
          </p>
        </div>
        <Button onClick={handleAddSession}>
          <Plus className="mr-2 h-4 w-4" />
          Add Study Session
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-primary" />
              Weekly Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monday</span>
                <span className="text-sm font-medium">2h 30m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tuesday</span>
                <span className="text-sm font-medium">1h 45m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Wednesday</span>
                <span className="text-sm font-medium">3h 15m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Thursday</span>
                <span className="text-sm font-medium">2h 00m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Friday</span>
                <span className="text-sm font-medium">1h 30m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Saturday</span>
                <span className="text-sm font-medium">4h 00m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sunday</span>
                <span className="text-sm font-medium">2h 45m</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-primary" />
              Today's Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <h4 className="font-medium">Mathematics</h4>
                  <p className="text-sm text-muted-foreground">9:00 AM - 10:30 AM</p>
                </div>
                <Button variant="outline" size="sm">
                  Start
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <h4 className="font-medium">Physics</h4>
                  <p className="text-sm text-muted-foreground">2:00 PM - 3:30 PM</p>
                </div>
                <Button variant="outline" size="sm">
                  Start
                </Button>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                No more sessions scheduled for today
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 