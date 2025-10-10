import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Upload, FileText, CheckCircle, XCircle, ArrowLeft, Download } from 'lucide-react';

export default function BulkUpload() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError('');
      setResult(null);
    } else {
      setError('Please select a valid CSV file');
      setFile(null);
    }
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const certificates = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const cert = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        // Map CSV headers to database fields
        if (header.toLowerCase() === 'email') cert.email = value;
        else if (header.toLowerCase() === 'name') cert.name = value;
        else if (header.toLowerCase().includes('event')) cert.event_name = value;
        else if (header.toLowerCase().includes('date')) cert.date_of_event = value;
        else if (header.toLowerCase() === 'category') cert.category = value;
        else if (header.toLowerCase() === 'tags') cert.tags = value;
        else if (header.toLowerCase().includes('url') || header.toLowerCase().includes('attachment')) {
          cert.certificate_url = value;
        }
      });
      
      // Only add if required fields exist
      if (cert.email && cert.name && cert.event_name && cert.certificate_url) {
        certificates.push(cert);
      }
    }
    
    return certificates;
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const text = await file.text();
      const certificates = parseCSV(text);

      if (certificates.length === 0) {
        setError('No valid certificates found in CSV. Please check the format.');
        setUploading(false);
        return;
      }

      const response = await fetch('/api/admin/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificates }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          uploaded: data.uploaded,
          skipped: data.skipped,
          message: data.message
        });
        setFile(null);
      } else {
        setError(data.error || 'Failed to upload certificates');
      }
    } catch (err) {
      setError('Error processing file. Please check the format.');
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleCSV = `Email,Name,Event Name,Date of the event,Category,Tags,Certificate URL
john@example.com,John Doe,Annual Conference 2025,2025-10-15,Participant,Workshop,https://drive.google.com/file/d/xxxxx
jane@example.com,Jane Smith,Tech Summit 2025,2025-11-20,Speaker,Conference,https://drive.google.com/file/d/yyyyy`;

    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-certificate-upload.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Bulk Upload Certificates</h1>
            <p className="text-gray-600">Upload multiple certificates at once using a CSV file</p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="font-semibold text-blue-900 mb-3">📋 CSV Format Instructions</h2>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• <strong>Required columns:</strong> Email, Name, Event Name, Certificate URL</li>
              <li>• <strong>Optional columns:</strong> Date of the event, Category, Tags</li>
              <li>• First row should contain column headers</li>
              <li>• Certificate URL can be Google Drive link or direct PDF link</li>
              <li>• Use comma (,) as separator</li>
            </ul>
            <button
              onClick={downloadSampleCSV}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
            >
              <Download className="w-4 h-4" />
              Download Sample CSV
            </button>
          </div>

          {/* File Upload */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select CSV File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-1">
                  {file ? file.name : 'Click to select CSV file'}
                </p>
                <p className="text-sm text-gray-500">or drag and drop</p>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Success Result */}
          {result && result.success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Upload Successful!</p>
                <p className="text-sm text-green-700">{result.message}</p>
                {result.skipped > 0 && (
                  <p className="text-sm text-green-700 mt-1">
                    Note: {result.skipped} rows were skipped due to missing required fields
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploa
