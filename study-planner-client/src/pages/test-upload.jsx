import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import FileUploadTester from "../components/FileUploadTester";

export default function TestUploadPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">File Upload Tester</h1>
      </div>
      
      <div className="mb-6 p-4 border rounded-lg bg-muted/30">
        <h2 className="text-lg font-medium mb-2">End-to-End Testing Instructions</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This page helps you verify that your file upload system is working correctly from frontend to backend.
        </p>
        
        <div className="text-sm space-y-2">
          <div className="flex items-start">
            <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-2 mt-0.5">1</div>
            <p>Fill in the subject and title fields and select a file (PDF, DOC, TXT, etc.)</p>
          </div>
          
          <div className="flex items-start">
            <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-2 mt-0.5">2</div>
            <p>Click "Test File Upload" and watch the test results</p>
          </div>
          
          <div className="flex items-start">
            <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-2 mt-0.5">3</div>
            <p>The tester will verify: 
              <span className="font-medium text-foreground">Supabase upload</span> → 
              <span className="font-medium text-foreground">MongoDB save</span> → 
              <span className="font-medium text-foreground">File accessibility</span>
            </p>
          </div>
          
          <div className="flex items-start">
            <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-2 mt-0.5">4</div>
            <p>If all tests pass, you can click the link icon to open and view your uploaded file</p>
          </div>
        </div>
      </div>
      
      <FileUploadTester />
      
      <div className="mt-8 p-4 border rounded-lg bg-amber-50 border-amber-200">
        <h2 className="text-lg font-medium text-amber-800 mb-2">Troubleshooting</h2>
        <div className="space-y-3 text-sm text-amber-700">
          <div>
            <h3 className="font-medium">If Supabase upload fails:</h3>
            <ul className="list-disc pl-5 mt-1">
              <li>Check your Supabase API keys and configuration</li>
              <li>Verify network connectivity</li>
              <li>Check server logs for detailed error messages</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium">If MongoDB save fails:</h3>
            <ul className="list-disc pl-5 mt-1">
              <li>Check your MongoDB connection string</li>
              <li>Verify the Note model schema</li>
              <li>Check server logs for database errors</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium">If File URL is not accessible:</h3>
            <ul className="list-disc pl-5 mt-1">
              <li>Verify the Supabase bucket has proper public access permissions</li>
              <li>Files uploaded to Supabase should work when opened in your application</li>
              <li>Ensure you're using HTTPS URLs (not HTTP)</li>
              <li>Check that the file exists in your Supabase dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 