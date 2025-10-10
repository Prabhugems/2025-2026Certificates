import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Calendar, MapPin, ArrowLeft, Plus, Edit, Trash2, 
  Upload, FileText, Image, Award 
} from 'lucide-react';

export default function EventDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [event, setEvent] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchEventDetails();
      fetchTemplates();
    }
  }, [id]);

  const fetchEventDetails = async () => {
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
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/templates/list?event_id=${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch('/api/admin/templates/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: templateId }),
      });

      if (response.ok) {
        alert('Template deleted successfully');
        fetchTemplates();
      } else {
        alert('Failed to delete template');
      }
    } catch (error) {
      alert('Error deleting template');
    }
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/admin/events')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-3"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Events
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{event.event_name}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  {event.event_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{event.event_date}</span>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push(`/admin/events/${id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <Edit className="w-4 h-4" />
              Edit Event
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Certificate Templates Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Certificate Templates</h2>
              <p className="text-sm text-gray-600 mt-1">Upload templates for different categories</p>
            </div>
            <button
              onClick={() => router.push(`/admin/events/${id}/templates/new`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              Add Template
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Templates Yet</h3>
              <p className="text-gray-600 mb-6">Upload certificate templates for different categories</p>
              <button
                onClick={() => router.push(`/admin/events/${id}/templates/new`)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-5 h-5" />
                Add First Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
                >
                  {/* Template Preview */}
                  <div className="aspect-[4/3] bg-gray-100 relative">
                    {template.template_url ? (
                      <img
                        src={template.template_url}
                        alt={template.category}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Template Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">{template.category}</h3>
                    <div className="text-sm text-gray-600 mb-4">
                      Template uploaded
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/admin/events/${id}/templates/${template.id}/edit`)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="px-3 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generate Certificates Section */}
        {templates.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-sm p-6 border border-green-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Ready to Generate Certificates?</h2>
                <p className="text-gray-600 mb-4">
                  You have {templates.length} template{templates.length !== 1 ? 's' : ''} ready. 
                  Upload a CSV file to generate certificates for all participants.
                </p>
              </div>
              <button
                onClick={() => router.push(`/admin/events/${id}/generate`)}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition whitespace-nowrap"
              >
                <Upload className="w-5 h-5" />
                Generate Certificates
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
