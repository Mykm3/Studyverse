"use client"

import { Progress } from "./ui/Progress"

/**
 * @typedef {Object} SessionProgressProps
 * @property {number} progress - Session progress percentage
 * @property {number} currentPage - Current page number
 * @property {number} totalPages - Total pages in the document
 */

/**
 * Displays progress bars for session and document progress
 * @param {SessionProgressProps} props
 */
export function SessionProgress({ progress, currentPage, totalPages }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">Session Progress</span>
          <span className="text-sm font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div>
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">Document Progress</span>
          <span className="text-sm font-medium">{Math.round((currentPage / totalPages) * 100)}%</span>
        </div>
        <Progress value={(currentPage / totalPages) * 100} className="h-2" />
        <div className="text-xs text-muted-foreground mt-1 text-right">
          Page {currentPage} of {totalPages}
        </div>
      </div>
    </div>
  )
} 