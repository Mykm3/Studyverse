import React, { useEffect, useRef, useState } from 'react';
import { Button } from "./ui/Button";
import { Download, ExternalLink, RefreshCcw } from "lucide-react";

const PDFViewer = ({ fileUrl, onError }) => {
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add token to URL if not already present
  const getAuthenticatedUrl = (url) => {
    if (!url) return null;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return url;
      
      const urlObj = new URL(url);
      if (!urlObj.searchParams.has('token')) {
        urlObj.searchParams.append('token', token);
      }
      return urlObj.toString();
    } catch (err) {
      console.error('Error adding token to URL:', err);
      return url;
    }
  };

  useEffect(() => {
    if (!fileUrl) {
      setError("No PDF URL provided");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Get authenticated URL
    const authenticatedUrl = getAuthenticatedUrl(fileUrl);
    console.log('Using authenticated URL for PDF:', authenticatedUrl);

    // Set up iframe load and error handlers
    const handleIframeLoad = () => {
      console.log('PDF iframe loaded successfully');
      setLoading(false);
    };

    const handleIframeError = (e) => {
      console.error('Error loading PDF in iframe:', e);
      setError("Could not load PDF. Try downloading instead.");
      setLoading(false);
      if (onError) onError(e);
    };

    // Apply handlers to iframe
    if (iframeRef.current) {
      iframeRef.current.onload = handleIframeLoad;
      iframeRef.current.onerror = handleIframeError;
      
      // Set the source to the authenticated URL
      iframeRef.current.src = authenticatedUrl;
    }

    return () => {
      // Clean up
      if (iframeRef.current) {
        iframeRef.current.onload = null;
        iframeRef.current.onerror = null;
      }
    };
  }, [fileUrl, onError]);

  const handleRetry = () => {
    if (iframeRef.current && fileUrl) {
      setLoading(true);
      setError(null);
      const authenticatedUrl = getAuthenticatedUrl(fileUrl);
      iframeRef.current.src = authenticatedUrl;
    }
  };

  // Show error if we couldn't load the PDF
  if (error) {
    // Get authenticated URL for download/view links
    const authenticatedUrl = getAuthenticatedUrl(fileUrl);
    
    return (
      <div className="flex flex-col h-full items-center justify-center bg-gray-100 dark:bg-gray-800 p-4 text-center">
        <div className="text-red-500 mb-4">
          <p className="text-lg font-medium mb-2">Error Loading PDF</p>
          <p className="text-sm max-w-md mx-auto">{error}</p>
          <p className="text-sm mt-2">The document cannot be displayed in the built-in viewer. Please download it or open it in a new tab instead.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRetry}
            title="Try again"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(authenticatedUrl, '_blank')}
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => {
              // Create a temporary anchor to download the file
              const a = document.createElement('a');
              a.href = authenticatedUrl;
              a.download = 'document.pdf';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
            title="Download"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Document
          </Button>
        </div>
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
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0"
        style={{
          height: "100%",
          width: "100%",
          visibility: loading ? "hidden" : "visible"
        }}
        title="PDF Viewer"
        allowFullScreen
      />
    </div>
  );
};

export default PDFViewer; 