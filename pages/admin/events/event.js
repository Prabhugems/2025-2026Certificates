// Event Details Page
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Upload, Calendar, MapPin, Award, AlertCircle, Image } from 'lucide-react';

export default function EventDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [event, setEvent] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      const [eventRes, templatesRes] = await Promise.all([
        fetch(`/api/admin/events/get?id=${id}`),
        fetch(`/api/admin/templates/list?event_id=${id}`)
      ]);

      const eventData = await eventRes.json();
      const templatesData = await templatesRes.json();

      if (eventRes.ok && eventData.event) {
        setEvent(eventData.event);
      } else {
        setError('Event not found');
      }

      if (templatesRes.ok) {
        setTemplates(templatesData.templates || []);
      }
    } catch (err) {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Event</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-600 mb-6">Event ID: {id}</p>
          <button
            onClick={() => router.push('/admin/events')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button onClick={() => router.push('/admin/events')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-3">
            <ArrowLeft className="w-5 h-5" />
            Back to Events
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{event.event_name}</h1>
              <div className="flex gap-4 text-sm text-gray-600 mt-1">
                {event.event_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {event.event_date}
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Certificate Templates</h2>
              <p className="text-sm text-gray-600">Upload templates for different categories</p>
            </div>
            <button
              onClick={() => router.push(`/admin/events/upload-template?event_id=${id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Add Template
            </button>
          </div>

          {templates.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Templates Yet</h3>
              <p className="text-gray-600 mb-6">Upload certificate templates for different categories</p>
              <button
                onClick={() => router.push(`/admin/events/upload-template?event_id=${id}`)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add First Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(t => (
                <div key={t.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
                  <div className="aspect-[4/3] bg-gray-100">
                    <img src={t.template_url} alt={t.category} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800">{t.category}</h3>
                    <p className="text-sm text-gray-600 mt-1">Template uploaded</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {templates.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-sm p-6 border border-green-200">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Generate Certificates</h2>
                <p className="text-gray-600">Upload CSV to create certificates for all participants</p>
              </div>
              <button
                onClick={() => router.push(`/admin/events/generate?event_id=${id}`)}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
              >
                <Upload className="w-5 h-5" />
                Upload CSV
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
