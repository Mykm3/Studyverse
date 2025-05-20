import { useEffect, useRef, useState } from "react";
import WebViewer from "@pdftron/pdfjs-express-viewer";
import { Button } from "./ui/Button";
import { ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

const PDFViewer = ({ fileUrl, onError }) => {
  const viewerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [instance, setInstance] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const initializeViewer = async () => {
      if (!fileUrl) {
        setLoading(false);
        return;
      }
      
      try {
        console.log("Initializing PDF.js Express with URL:", fileUrl);
        setLoading(true);
        
        const instance = await WebViewer(
          {
            path: "/pdfjs-express/lib", // Updated path to point to lib directory
            initialDoc: fileUrl,
            enableAnnotations: false,
            fullAPI: false,
            disabledElements: [
              'ribbons',
              'toggleNotesButton',
              'searchButton',
              'menuButton',
              'toolsHeader',
              'toolsButton',
            ],
          },
          viewerRef.current
        );
        
        if (isMounted) {
          console.log("PDF.js Express initialized successfully");
          setInstance(instance);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error initializing PDF.js Express viewer:", err);
        if (isMounted) {
          setError(err.message || "Failed to load PDF viewer");
          setLoading(false);
          if (onError) onError(err);
        }
      }
    };

    initializeViewer();
    
    return () => {
      isMounted = false;
      // Clean up resources if needed
      if (instance) {
        try {
          instance.dispose && instance.dispose();
        } catch (err) {
          console.error("Error disposing PDF.js Express instance:", err);
        }
      }
    };
  }, [fileUrl, onError]);

  // Show error if we couldn't load the viewer or PDF
  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-gray-100 dark:bg-gray-800 p-4 text-center">
        <div className="text-red-500 mb-4">
          <p className="text-lg font-medium mb-2">Error Loading PDF</p>
          <p className="text-sm max-w-md mx-auto">{error}</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.open(fileUrl, '_blank')}
          title="Download"
        >
          <Download className="h-4 w-4 mr-2" />
          Download PDF Instead
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/50 dark:bg-gray-900/50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      <div 
        ref={viewerRef} 
        className="webviewer"
        style={{ 
          height: "100%", 
          width: "100%",
          visibility: loading ? "hidden" : "visible"
        }} 
      />
    </div>
  );
};

export default PDFViewer; 