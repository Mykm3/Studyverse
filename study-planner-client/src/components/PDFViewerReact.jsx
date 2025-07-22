import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, Download, HelpCircle } from 'lucide-react';
import { Button } from './ui/Button';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Use the local worker file from public directory (.mjs extension for newer versions)
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export default function PDFViewerReact({ 
  fileUrl, 
  title,
  onDownload,
  className = ""
}) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Handle document loading
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setLoading(false);
    setError(null);
  };

  // Handle document loading error
  const onDocumentLoadError = (err) => {
    console.error('PDF loading error:', err);
    setError('Failed to load PDF. Please try downloading it instead.');
    setLoading(false);
  };

  // Handle page navigation
  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  };

  // Handle zoom
  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* PDF Viewer Header */}
      <div className="flex justify-between items-center p-2 bg-muted/50 border-b">
        <div className="flex items-center">
          <div className="text-lg mr-2">📄</div>
          <h3 className="font-medium truncate max-w-[200px] md:max-w-md">
            {title || 'Document'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={zoomOut}
            className="h-8 w-8 p-0"
          >
            <span className="text-sm">-</span>
          </Button>
          <span className="text-sm w-16 text-center">{Math.round(scale * 100)}%</span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={zoomIn}
            className="h-8 w-8 p-0"
          >
            <span className="text-sm">+</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={resetZoom}
            className="h-8 px-2 text-xs"
          >
            Reset
          </Button>
          {onDownload && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onDownload}
              className="h-8 w-8 p-0"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* PDF Viewer Content */}
      <div className="relative flex-1 overflow-auto">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="bg-red-100 dark:bg-red-900/20 p-6 rounded-lg max-w-md text-center">
              <HelpCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-muted-foreground mb-2">{error}</p>
              {onDownload && (
                <Button 
                  size="sm" 
                  onClick={onDownload}
                  className="mx-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Instead
                </Button>
              )}
            </div>
          </div>
        )}
        
        <div className="flex flex-col items-center">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center p-4">
                <HelpCircle className="h-8 w-8 text-red-500 mb-2" />
                <p className="text-center text-muted-foreground">Failed to load PDF</p>
              </div>
            }
          >
            <Page 
              pageNumber={pageNumber} 
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
          
          {numPages && (
            <div className="flex items-center justify-center gap-4 py-2 bg-muted/50 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {pageNumber} of {numPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}