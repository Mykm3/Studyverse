import { useState, useEffect } from "react";

export default function CircularProgress({
  value = 0,
  size = 100,
  strokeWidth = 8,
  circleColor = "#e2e8f0",
  progressColor = "#7c3aed",
}) {
  const [progress, setProgress] = useState(0);

  // Animate the progress value
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(value);
    }, 100);

    return () => clearTimeout(timer);
  }, [value]);

  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={circleColor} strokeWidth={strokeWidth} />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
        />
      </svg>

      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold">{progress}%</span>
      </div>
    </div>
  );
} 