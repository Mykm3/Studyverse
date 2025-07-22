"use client"

import React from 'react';

/**
 * A simple document viewer component that renders custom content
 * 
 * @param {Object} props
 * @param {Object} props.document - Document object
 * @param {number} props.currentPage - Current page number
 * @param {Function} props.onPageChange - Page change handler
 * @param {Array} props.highlights - Highlights array
 * @param {Function} props.onAddHighlight - Add highlight handler
 * @param {string} props.notes - Notes text
 * @param {Function} props.onNotesChange - Notes change handler
 * @param {React.ReactNode} props.customContent - Custom content to render
 */
export function DocumentViewer({
  document,
  currentPage,
  onPageChange,
  highlights,
  onAddHighlight,
  notes,
  onNotesChange,
  customContent
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        {customContent}
      </div>
    </div>
  );
}

export default DocumentViewer; 