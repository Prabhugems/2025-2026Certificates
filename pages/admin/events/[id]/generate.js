import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Upload, Download, CheckCircle, AlertCircle } from 'lucide-react';

export default function GenerateCertificates() {
  const router = useRouter();
  const { id } = router.query;
  const [event, setEvent] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState({ success: 0, failed: 0, errors: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchEvent();
      fetchTemplates();
    }
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/admin/events/get?id=${id}`);
      const data = await response.json();
      if (response.ok) {
        setEvent(data.event);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`/api/admin/templates/list?event_id=${id}`);
      const data = await response.json();
      if (response.ok) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      parseCSV(file);
      setError('');
    } else {
      setError('Please select a valid CSV file');
    }
  };

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        // Only add if has required fields
        if (row.email && row.name && row.category) {
          data.push(row);
        }
      }
      
      setCsvData(data);
    };
    reader.readAsText(file);
  };

  const handleGenerate = async () => {
    if (csvData.length === 0) {
      setError('No valid data in CSV');
      return;
    }

    setGenerating(true);
    setProgress({ current: 0, total: csvData.length });
    setResults({ success: 0, failed: 0, errors: [] });

    try {
      const response = await fetch('/api/admin/generate-certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: id,
          participants: csvData
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResults({
          success: data.generated || 0,
          failed: data.failed || 0,
          errors: data.errors || []
        });
        alert(`Successfully generated ${data.generated} certificates!`);
      } else {
        setError(data.error || 'Failed to generate certificates');
      }
    } catch (err) {
      setError('Error generating certificates');
    } finally {
      setGenerating(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleCSV = `Email,Name,Category
john@example.com,Dr. John Doe,Delegate
jane@example.com,Dr. Jane Smith,Faculty
bob@example.com,Dr. Bob Wilson,Speaker`;

    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-certificate-upload.csv';
    a.click();
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push(`/admin/events/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Event
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Generate Certificates</h1>
            <p className="text-sm text-gray-600 mt-1">{event.event_name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Templates Check */}
        {templates.length === 0 ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <AlertCircle className="w-8 h-8 text-red-600 mb-3" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">No Templates Available</h3>
            <p className="text-red-700 mb-4">
              You need to upload certificate templates before generating certificates.
            </p>
            <button
              onClick={() => router.push(`/admin/events/${id}`)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Go Back and Add Templates
            </button>
          </div>
        ) : (
          <>
            {/* Available Templates */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-blue-900 mb-3">📋 Available Templates</h3>
              <div className="flex flex-wrap gap-2">
                {templates.map((template) => (
                  <span key={template.id} className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">
                    {template.category}
                  </span>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">📝 CSV Format</h2>
              <div className="space-y-3 text-sm text-gray-600 mb-4">
                <p><strong>Required columns:</strong> Email, Name, Category</p>
                <p><strong>Category values must match:</strong> {templates.map(t => t.category).join(', ')}</p>
                <p><strong>Example:</strong></p>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
Email,Name,Category{'\n'}
john@example.com,Dr. John Doe,Delegate{'\n'}
jane@example.com,Dr. Jane Smith,Faculty
                </pre>
              </div>
              <button
                onClick={downloadSampleCSV}
                className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
              >
                <Download className="w-4 h-4" />
                Download Sample CSV
              </button>
            </div>

            {/* File Upload */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">📤 Upload CSV File</h2>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-1">
                    {csvFile ? csvFile.name : 'Click to select CSV file'}
                  </p>
                  <p className="text-sm text-gray-500">or drag and drop</p>
                </label>
              </div>

              {csvData.length > 0 && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">
                    ✓ Found <strong>{csvData.length}</strong> valid participants
                  </p>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
                {error}
              </div>
            )}

            {/* Generate Button */}
            {csvData.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-lg"
                >
                  {generating ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating {progress.current}/{progress.total}...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-6 h-6" />
                      Generate {csvData.length} Certificates
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Results */}
            {results.success > 0 && (
              <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Generation Results</h3>
                <div className="space-y-2">
                  <p className="text-green-600">✓ Successfully generated: {results.success}</p>
                  {results.failed > 0 && (
                    <p className="text-red-600">✗ Failed: {results.failed}</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
