import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BarChart, ArrowRight, TrendingUp } from 'lucide-react';

const Analytics = () => {
  const navigate = useNavigate();
  const handleGoToReview = () => {
    navigate('/study-plan?tab=review');
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <BarChart className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Study Analytics</h1>
            <p className="text-xl text-muted-foreground">
              Your analytics have moved to a better location!
            </p>
          </div>

          {/* Main Card */}
          <Card className="p-8 shadow-lg">
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <TrendingUp className="h-16 w-16 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">Enhanced Analytics Experience</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We've integrated your study analytics directly into the Study Plan page for a more seamless experience.
                  You can now view your performance metrics, session statistics, and progress trends all in one place.
                </p>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleGoToReview}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Go to Analytics
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="pt-4 text-sm text-muted-foreground">
                <p>
                  <strong>Tip:</strong> You can also access analytics by going to Study Plan → Review tab
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
            {[
              {
                title: "Session Statistics",
                description: "Track completion rates and study time",
                icon: <BarChart className="h-6 w-6" />
              },
              {
                title: "Subject Performance",
                description: "Monitor progress across all subjects",
                icon: <TrendingUp className="h-6 w-6" />
              },
              {
                title: "Weekly Trends",
                description: "Visualize your study patterns",
                icon: <BarChart className="h-6 w-6" />
              }
            ].map((feature, index) => (
              <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                <CardContent className="text-center space-y-2">
                  <div className="flex justify-center text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;