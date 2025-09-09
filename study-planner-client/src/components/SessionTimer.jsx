"use client"

import { useState, useEffect } from "react"
import { Play, Pause, RotateCcw, Clock, Timer, Activity } from 'lucide-react'
import { Button } from "./ui/Button"
import { Card, CardContent } from "./ui/Card"
import { useToast } from "./ui/use-toast"

/**
 * @typedef {Object} SessionTimerProps
 * @property {number} duration - Duration in minutes
 * @property {boolean} isRunning - Whether the timer is currently running
 * @property {number} activeTime - Active time in seconds
 * @property {number} timeLeft - Time left in seconds
 * @property {number} progress - Progress percentage
 * @property {Function} onStart - Function called when timer starts
 * @property {Function} onPause - Function called when timer pauses
 * @property {Function} onReset - Function called when timer resets
 * @property {Function} onComplete - Function called when timer completes
 * @property {Function} formatTime - Function to format time
 */

/**
 * Modern Session Timer Component with persistent state
 * @param {SessionTimerProps} props
 */
export function SessionTimer({
  duration,
  isRunning,
  activeTime,
  timeLeft,
  progress,
  onStart,
  onPause,
  onReset,
  onComplete,
  formatTime,
}) {
  const { toast } = useToast()
  const [showTimeLeft, setShowTimeLeft] = useState(true) // toggle between time left and time elapsed
  const [isHovered, setIsHovered] = useState(false)

  // Check if timer has reached zero
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      onComplete()
      toast({
        title: "🎉 Time's Up!",
        description: "Your scheduled study time has ended. Great work!",
      })
    }
  }, [timeLeft, isRunning, onComplete, toast])

  const handleToggleView = () => {
    setShowTimeLeft(!showTimeLeft)
  }

  const handleReset = () => {
    onReset()
    toast({
      title: "Timer Reset",
      description: "Your study timer has been reset.",
    })
  }

  const handleStart = () => {
    onStart()
    toast({
      title: "Session Started",
      description: "Your study session has begun. Stay focused!",
    })
  }

  const handlePause = () => {
    onPause()
    toast({
      title: "Session Paused",
      description: "Take a break. Resume when you're ready!",
    })
  }

  // Calculate progress for visual indicators
  const progressPercentage = Math.min(100, progress)
  const isNearCompletion = progressPercentage >= 80
  const isHalfway = progressPercentage >= 50

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 bg-white/70 backdrop-blur-sm border-0 shadow-lg ${
        isRunning ? 'ring-1 ring-primary/30' : ''
      } ${isHovered ? 'shadow-md' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated progress indicator */}
      <div
        className={`absolute top-0 left-0 h-1 bg-gradient-to-r transition-all duration-1000 ${
          isNearCompletion ? 'from-orange-400 to-red-500' :
          isHalfway ? 'from-yellow-400 to-orange-500' :
          'from-primary to-primary/80'
        }`}
        style={{ width: `${progressPercentage}%` }}
      />

      <CardContent className="p-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`} />
            <h3 className="text-xs font-medium text-muted-foreground">
              {isRunning ? 'Active' : 'Timer'}
            </h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Activity className="h-3 w-3" />
            <span>{progressPercentage}%</span>
          </div>
        </div>

        {/* Compact timer display */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-1 mb-1">
            {showTimeLeft ? <Timer className="h-3 w-3 text-muted-foreground" /> : <Clock className="h-3 w-3 text-muted-foreground" />}
            <span className="text-xs font-medium text-muted-foreground">
              {showTimeLeft ? "Remaining" : "Elapsed"}
            </span>
          </div>

          <div
            className={`text-2xl font-bold cursor-pointer transition-all duration-300 hover:scale-105 ${
              isNearCompletion ? 'text-orange-600' :
              isRunning ? 'text-primary' : 'text-foreground'
            }`}
            onClick={handleToggleView}
          >
            {showTimeLeft ? formatTime(timeLeft) : formatTime(activeTime)}
          </div>

          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="h-2 w-2" />
              {showTimeLeft ? `${Math.floor(activeTime / 60)}m` : `${Math.floor(timeLeft / 60)}m`}
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-2 w-2" />
              {Math.floor(duration)}m total
            </span>
          </p>
        </div>

        {/* Compact Control buttons */}
        <div className="flex gap-2 mb-3">
          {isRunning ? (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 transition-all duration-200 hover:bg-orange-50 hover:border-orange-300 text-xs h-8"
              onClick={handlePause}
            >
              <Pause className="h-3 w-3 mr-1" />
              Pause
            </Button>
          ) : (
            <Button
              className="flex-1 transition-all duration-200 hover:shadow-md text-xs h-8"
              variant="default"
              size="sm"
              onClick={handleStart}
            >
              <Play className="h-3 w-3 mr-1" />
              {activeTime > 0 ? "Resume" : "Start"}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="flex-1 transition-all duration-200 hover:bg-red-50 hover:border-red-300 text-xs h-8"
            onClick={handleReset}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>

        {/* Compact Progress visualization */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 rounded-full ${
                isNearCompletion ? 'bg-gradient-to-r from-orange-400 to-red-500' :
                isHalfway ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                'bg-gradient-to-r from-primary to-primary/80'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}