import React from 'react';
import { usePersistentTimer } from '../hooks/usePersistentTimer';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

/**
 * Test component for the persistent timer functionality
 * This can be used to verify the timer works correctly
 */
export function TestPersistentTimer() {
  const timer = usePersistentTimer('test-session-123', 5); // 5 minute test session

  return (
    <div className="p-6 max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Persistent Timer Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold">
              {timer.formatTime(timer.activeTime)}
            </div>
            <div className="text-sm text-gray-600">
              Active Time
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-semibold">
              {timer.formatTime(timer.timeLeft)}
            </div>
            <div className="text-sm text-gray-600">
              Time Remaining
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress:</span>
              <span>{timer.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${timer.progress}%` }}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            {timer.isRunning ? (
              <Button onClick={timer.pause} variant="outline" className="flex-1">
                Pause
              </Button>
            ) : (
              <Button onClick={timer.start} className="flex-1">
                {timer.activeTime > 0 ? 'Resume' : 'Start'}
              </Button>
            )}
            <Button onClick={timer.reset} variant="outline" className="flex-1">
              Reset
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <div>Status: {timer.isRunning ? 'Running' : 'Paused'}</div>
            <div>Complete: {timer.isComplete ? 'Yes' : 'No'}</div>
            <div>Session ID: test-session-123</div>
          </div>
          
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
            💡 Try refreshing the page while the timer is running - it should continue from where it left off!
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
