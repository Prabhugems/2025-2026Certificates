import React, { useState } from 'react';
import { Search, Download, Calendar, Award, Tag } from 'lucide-react';

export default function CertificatePortal() {
  const [email, setEmail] = useState('');
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setCertificates(data.certificates || []);
      } else {
        setError(data.error || 'Failed to fetch certificates');
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (url, name, eventName) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}_${eventName}_Certificate.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Certificate Portal</h1>
          </div>
          <p className="text-gray-600 mt-2">Search and download your certificates</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Find Your Certificates</h2>
          
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>

        {searched && !loading && (
          <div>
            {certificates.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Found {certificates.length} certificate{certificates.length !== 1 ? 's' : ''}
                </h3>
                
                {certificates.map((cert, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-6 border border-gray-100"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-3">
                        <div>
                          <h4 className="text-xl font-semibold text-gray-800">{cert.name}</h4>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Award className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">Event:</span>
                            <span>{cert.eventName}</span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4 text-green-600" />
                            <span className="font-medium">Date:</span>
                            <span>{cert.date}</span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-600">
                            <Tag className="w-4 h-4 text-purple-600" />
                            <span className="font-medium">Category:</span>
                            <span>{cert.category}</span>
                          </div>

                          {cert.tags && (
                            <div className="flex items-start gap-2 text-gray-600">
                              <Tag className="w-4 h-4 text-orange-600 mt-0.5" />
                              <span className="font-medium">Tags:</span>
                              <span>{cert.tags}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownload(cert.certificateUrl, cert.name, cert.eventName)}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 font-medium whitespace-nowrap"
                      >
                        <Download className="w-5 h-5" />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Certificates Found</h3>
                <p className="text-gray-600">
                  We couldn't find any certificates for this email address.
                  <br />
                  Please check your email and try again.
                </p>
              </div>
            )}
          </div>
        )}

        {!searched && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Welcome!</h3>
            <p className="text-gray-600">Enter your email address above to view and download your certificates</p>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-500 text-sm">
        <p>Having trouble? Contact support for assistance.</p>
      </div>
    </div>
  );
}
