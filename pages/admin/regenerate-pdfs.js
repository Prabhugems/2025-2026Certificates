import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { FileText, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function RegeneratePDFs() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState({ success: [], failed: [] });

  useEffect(() => {
    fetchCertificatesWithoutPDFs();
  }, []);

  async function fetchCertificatesWithoutPDFs() {
    setLoading(true);
    try {
      // Get certificates that might need PDF regeneration
      // (those with template URLs or no proper PDF URLs)
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .not('event_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter certificates that need regeneration
      const needsRegeneration = data.filter(cert => 
        !cert.certificate_url || 
        cert.certificate_url.includes('template') ||
        !cert.certificate_url.includes('.pdf')
      );

      setCertificates(needsRegeneration);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      alert('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  }

  async function regenerateAllPDFs() {
    if (!confirm(`Regenerate PDFs for ${certificates.length} certificates?`)) {
      return;
    }

    setRegenerating(true);
    setProgress({ current: 0, total: certificates.length });
    
    const successList = [];
    const failedList = [];

    for (let i = 0; i < certificates.length; i++) {
      const cert = certificates[i];
      setProgress({ current: i + 1, total: certificates.length });

      try {
        const response = await fetch('/api/admin/generate-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ certificateId: cert.id })
        });

        const result = await response.json();

        if (response.ok) {
          successList.push({ cert, result });
        } else {
          failedList.push({ cert, error: result.error });
        }
      } catch (error) {
        failedList.push({ cert, error: error.message });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setResults({ success: successList, failed: failedList });
    setRegenerating(false);
    
    // Refresh the list
    fetchCertificatesWithoutPDFs();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Regenerate Certificate PDFs
              </h1>
              <p className="text-gray-600 mt-1">
                Generate PDFs for certificates that don't have them yet
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/admin/dashboard'}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back to Dashboard
            </button>
          </div>

          {certificates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium">All certificates have PDFs!</p>
              <p className="text-sm mt-2">No certificates need regeneration</p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>{certificates.length}</strong> certificates need PDF generation
                </p>
              </div>

              <button
                onClick={regenerateAllPDFs}
                disabled={regenerating}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-5 h-5 ${regenerating ? 'animate-spin' : ''}`} />
                {regenerating ? 'Regenerating...' : 'Regenerate All PDFs'}
              </button>

              {regenerating && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{progress.current} / {progress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {results.success.length > 0 && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-800">
                      Successfully Generated: {results.success.length}
                    </h3>
                  </div>
                </div>
              )}

              {results.failed.length > 0 && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-red-800">
                      Failed: {results.failed.length}
                    </h3>
                  </div>
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    {results.failed.map((item, idx) => (
                      <div key={idx} className="text-sm text-red-700 mb-1">
                        {item.cert.name}: {item.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <h3 className="font-semibold mb-3">Certificates to Process:</h3>
                <div className="max-h-96 overflow-y-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Email</th>
                        <th className="px-4 py-2 text-left">Event</th>
                        <th className="px-4 py-2 text-left">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certificates.map(cert => (
                        <tr key={cert.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-2">{cert.name}</td>
                          <td className="px-4 py-2">{cert.email}</td>
                          <td className="px-4 py-2">{cert.event_name}</td>
                          <td className="px-4 py-2">{cert.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
