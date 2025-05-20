"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Highlighter, Save, Download, BookOpen } from 'lucide-react'
import { Button } from "./ui/Button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/Tabs"
import { Textarea } from "./ui/Textarea"
import { useToast } from "./ui/use-toast"

/**
 * @typedef {Object} Document
 * @property {string} id - Document ID
 * @property {string} title - Document title
 * @property {string} type - Document type (e.g. 'pdf')
 * @property {number} totalPages - Total number of pages
 * @property {number} currentPage - Current page number
 */

/**
 * @typedef {Object} Highlight
 * @property {string} id - Highlight ID
 * @property {string} text - Highlighted text
 * @property {number} page - Page number
 * @property {string} timestamp - Timestamp
 */

/**
 * @typedef {Object} DocumentViewerProps
 * @property {Document} document - Document object
 * @property {number} currentPage - Current page number
 * @property {Function} onPageChange - Function to call when page changes
 * @property {Highlight[]} highlights - Array of highlights
 * @property {Function} onAddHighlight - Function to call when adding highlight
 * @property {string} notes - Notes content
 * @property {Function} onNotesChange - Function to call when notes change
 * @property {ReactNode} customContent - Custom content to render instead of the default document content
 */

/**
 * Document viewer component with highlight and notes functionality
 * @param {DocumentViewerProps} props
 */
export function DocumentViewer({
  document,
  currentPage,
  onPageChange,
  highlights,
  onAddHighlight,
  notes,
  onNotesChange,
  customContent,
}) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("document")
  const [isHighlightMode, setIsHighlightMode] = useState(false)
  const [selectedText, setSelectedText] = useState("")

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < document.totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  const handleToggleHighlightMode = () => {
    setIsHighlightMode(!isHighlightMode)
    toast({
      title: isHighlightMode ? "Highlight Mode Disabled" : "Highlight Mode Enabled",
      description: isHighlightMode ? "You can now read normally." : "Select text to highlight important information.",
    })
  }

  const handleTextSelection = () => {
    if (!isHighlightMode) return

    const selection = window.getSelection()
    if (selection && selection.toString()) {
      setSelectedText(selection.toString())

      // Create highlight object
      const highlight = {
        id: `highlight-${Date.now()}`,
        text: selection.toString(),
        page: currentPage,
        timestamp: new Date().toISOString(),
      }

      onAddHighlight(highlight)
    }
  }

  const handleSaveNotes = () => {
    toast({
      title: "Notes Saved",
      description: "Your notes have been saved successfully.",
    })
  }

  const handleDownloadNotes = () => {
    // Create a blob with the notes content
    const blob = new Blob([notes], { type: "text/plain" })
    const url = URL.createObjectURL(blob)

    // Create a temporary link and trigger download
    const a = document.createElement("a")
    a.href = url
    a.download = `${document.title}-notes.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Notes Downloaded",
      description: "Your notes have been downloaded as a text file.",
    })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          {document.title}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant={isHighlightMode ? "default" : "outline"}
            size="sm"
            onClick={handleToggleHighlightMode}
          >
            <Highlighter className="h-4 w-4 mr-1" />
            Highlight
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveNotes}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadNotes}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </div>

      <Tabs defaultValue="document" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="document">Document</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="highlights">Highlights</TabsTrigger>
        </TabsList>

        <TabsContent value="document" className="flex-1 p-4 overflow-auto">
          {customContent ? (
            // Render custom content if provided (e.g., iframe with PDF)
            <div className="bg-white rounded-lg p-0 min-h-full h-full flex flex-col">
              {customContent}
            </div>
          ) : (
            // Default document content
            <div className="bg-white rounded-lg p-6 min-h-full shadow-inner" onMouseUp={handleTextSelection}>
              {/* This would be replaced with an actual PDF viewer in a real app */}
              <div className="prose max-w-none">
                <h1>Integration Techniques</h1>
                <h2>Chapter 1: Integration by Parts</h2>
                <p>
                  Integration by parts is a technique used to find the integral of a product of functions. It is based on
                  the product rule for differentiation.
                </p>
                <div className="my-4 p-4 bg-muted rounded-md font-mono text-center">
                  ∫u(x)v'(x)dx = u(x)v(x) - ∫u'(x)v(x)dx
                </div>
                <p>
                  This formula is particularly useful when integrating products where one function becomes simpler when
                  differentiated and the other doesn't become too complex when integrated.
                </p>
                <h3>Example 1:</h3>
                <p>Evaluate ∫x·e^x dx</p>
                <p>
                  Let u = x and dv = e^x dx
                  <br />
                  Then du = dx and v = e^x
                </p>
                <div className="my-4 p-4 bg-muted rounded-md font-mono">
                  ∫x·e^x dx = x·e^x - ∫e^x dx
                  <br />= x·e^x - e^x + C<br />= e^x(x - 1) + C
                </div>
                <p>
                  This is just the beginning of integration techniques. In the following pages, we'll explore more complex
                  examples and additional methods for solving integrals.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-4">
            <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {document.totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === document.totalPages}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="notes" className="flex-1 p-4 overflow-auto">
          <Textarea
            placeholder="Take notes here..."
            className="min-h-[calc(100%-40px)]"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
          />
          <div className="flex justify-end mt-4">
            <Button variant="default" size="sm" onClick={handleSaveNotes}>
              <Save className="h-4 w-4 mr-1" />
              Save Notes
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="highlights" className="flex-1 p-4 overflow-auto">
          {highlights.length > 0 ? (
            <div className="space-y-4">
              {highlights.map((highlight) => (
                <div key={highlight.id} className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-3 rounded">
                  <p className="text-sm">{highlight.text}</p>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>Page {highlight.page}</span>
                    <span>{new Date(highlight.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Highlighter className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No highlights yet</p>
              <p className="text-sm mt-2">Enable highlight mode and select text in the document to add highlights</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 