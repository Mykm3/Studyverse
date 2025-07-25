import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import api from "@/utils/api";
import { useToast } from "./ui/use-toast";
import { Loader2, CheckCircle, XCircle, Upload, ExternalLink, Server } from "lucide-react";

export default function FileUploadTester() {
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [supabaseStatus, setSupabaseStatus] = useState(null);
  const [supabaseFiles, setSupabaseFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef();

  const checkSupabaseConnection = async () => {
    setSupabaseStatus("checking");
    try {
      const response = await api.get('/api/diagnostics/supabase-test');
      if (response && response.message === 'Supabase connected!') {
        setSupabaseStatus("connected");
        setSupabaseFiles(response.files || []);
        toast({ title: "Supabase connected!", description: `Found ${response.files?.length || 0} files in bucket.` });
      } else {
        setSupabaseStatus("failed");
        setSupabaseFiles([]);
        toast({ title: "Supabase connection failed", description: response?.error || "Unknown error", variant: "destructive" });
      }
    } catch (error) {
      setSupabaseStatus("failed");
      setSupabaseFiles([]);
      toast({ title: "Supabase connection failed", description: error.message, variant: "destructive" });
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setUploadResult(null);

    // ✅ Reset the input AFTER React processes state
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    }, 0);
  };

  const testFileUpload = async () => {
    if (!subject || !title || !file) {
      toast({ title: "Missing information", description: "Please provide subject, title and select a file", variant: "destructive" });
      return;
    }
    setLoading(true);
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('title', title);
      formData.append('note', file);
      const response = await api.upload('/api/notes/upload', formData);
      setUploadResult(response);
      toast({ title: "Upload successful!", description: response.publicUrl ? "File uploaded to Supabase." : "Upload succeeded, but no public URL returned." });
      // Refresh Supabase file list
      checkSupabaseConnection();
    } catch (error) {
      setUploadResult({ error: error.message });
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>File Upload End-to-End Tester (Supabase)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h2 className="font-semibold mb-2">End-to-End Testing Instructions</h2>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              <li>Fill in the subject and title fields and select a file (PDF, DOC, TXT, etc.)</li>
              <li>Click <b>Test File Upload</b> and watch the test results</li>
              <li>The tester will verify: <b>Supabase upload</b> and <b>public URL</b></li>
              <li>If the test passes, you can click the link icon to open and view your uploaded file</li>
            </ol>
          </div>

          <div className="mb-4">
            <h3 className="font-medium mb-1">Supabase Connection</h3>
            <Button onClick={checkSupabaseConnection} variant="outline" size="sm" className="mb-2">
              <Server className="h-4 w-4 mr-2" /> Check Supabase Connection
            </Button>
            {supabaseStatus === "checking" && <span className="text-blue-600 ml-2">Checking...</span>}
            {supabaseStatus === "connected" && <span className="text-green-600 ml-2">Connected</span>}
            {supabaseStatus === "failed" && <span className="text-red-600 ml-2">Connection failed</span>}
            {supabaseFiles.length > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                <b>Files in Supabase bucket:</b>
                <ul className="list-disc pl-5">
                  {supabaseFiles.map(f => <li key={f.id || f.name}>{f.name}</li>)}
                </ul>
              </div>
            )}
          </div>

          <div className="mb-4">
            <Label>Subject</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., math, physics, history" />
          </div>
          <div className="mb-4">
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Calculus Notes Chapter 5" />
          </div>
          <div className="mb-4">
            <Label>File</Label>
            <Input type="file" onChange={handleFileChange} ref={fileInputRef} />
            {file && <span className="text-xs text-gray-500 ml-2">{file.name}</span>}
          </div>
          <Button onClick={testFileUpload} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />} Test File Upload
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch border-t pt-4">
          <h3 className="font-medium mb-2 flex items-center">
            Uploaded Files ({supabaseFiles.length})
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {supabaseFiles.length > 0 ? (
              supabaseFiles.map(f => (
                <div key={f.id || f.name} className="text-sm border rounded-md p-2 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{f.name}</p>
                  </div>
                  {uploadResult && uploadResult.publicUrl && f.name === file?.name && (
                    <a href={uploadResult.publicUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">No files in Supabase bucket yet</p>
            )}
          </div>
          {uploadResult && uploadResult.error && (
            <div className="text-red-600 mt-2">Upload failed: {uploadResult.error}</div>
          )}
          {uploadResult && uploadResult.publicUrl && (
            <div className="text-green-600 mt-2">Upload successful! <a href={uploadResult.publicUrl} target="_blank" rel="noopener noreferrer" className="underline">View file</a></div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 