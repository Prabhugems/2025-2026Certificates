import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Calendar, MapPin, ArrowLeft, Plus, Edit, Trash2,
  Upload, FileText, Image, Award, FileCheck, AlertCircle
} from 'lucide-react';

export default function EventDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [event, setEvent] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    if (id) {
      fetchEventDetails();
      fetchTemplates();
    }
  }, [id, router]);

  const fetchEventDetails = async () => {
    try {
      console.log('Fetching event:', id); // Debug log
      const response = await fetch(`/api/admin/events/get?id=${id}`);
      const data = await response.json();
      
      console.log('Response:', data); // Debug log
      
      if (response.ok) {
        setEvent(data.event);
        setError('');
      } else {
        setError(data.error || 'Failed to load event');
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Failed to load event');
    } finally {
      setLoading(false);
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Event</h2>
          <p className="text-red-600 mb-4">{error || 'Event not found'}</p>
          <p className="text-sm text-gray-600 mb-4">Event ID: {id}</p>
          <div className="space-y-2">
            <button
              onClick={() => {
                setLoading(true);
                setError('');
                fetchEventDetails();
              }}
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/admin/events')}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Events List
            </button>
          </div>
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

          {templates.length === 0 ? (
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

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">{template.category}</h3>
                    <div className="text-sm text-gray-600 mb-4">
                      Template uploaded
