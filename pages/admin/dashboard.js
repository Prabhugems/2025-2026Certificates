import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Award, Plus, Upload, Download, Search, Edit, Trash2, 
  LogOut, BarChart3, FileText, RefreshCw, X, Save 
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [certificates, setCertificates] = useState([]);
  const [filteredCerts, setFilteredCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [stats, setStats] = useState({ total: 0, recent: 0 });

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
    } else {
      fetchCertificates();
    }
  }, []);

  // Search filter
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCerts(certificates);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = certificates.filter(cert => 
        cert.email?.toLowerCase().includes(query) ||
        cert.name?.toLowerCase().includes(query) ||
        cert.event_name?.toLowerCase().includes(query) ||
        cert.category?.toLowerCase().includes(query)
      );
      setFilteredCerts(filtered);
    }
  }, [searchQuery, certificates]);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/get-all-certificates');
      const data = await response.json();
      
      if (response.ok) {
        setCertificates(data.certificates || []);
        setFilteredCerts(data.certificates || []);
        setStats({
          total: data.certificates?.length || 0,
          recent: data.certificates?.filter(c => {
            const certDate = new Date(c.created_at);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return certDate > weekAgo;
          }).length || 0
        });
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this certificate?')) return;

    try {
      const response = await fetch('/api/admin/delete-certificate', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        alert('Certificate deleted successfully');
        fetchCertificates();
      } else {
        alert('Failed to delete certificate');
      }
    } catch (error) {
      alert('Error deleting certificate');
    }
  };

  const handleEdit = (cert) => {
    setEditingCert(cert);
    setShowEditModal(true);
  };

  const downloadCSV = () => {
    const headers = ['Email', 'Name', 'Event Name', 'Date', 'Category', 'Tags', 'Certificate URL'];
    const rows = certificates.map(cert => [
      cert.email,
      cert.name,
      cert.event_name,
      cert.date_of_event,
      cert.category,
      cert.tags || '',
      cert.certificate_url
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificates-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Certificate Management Portal</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Certificates</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Added This Week</p>
                <p className="text-3xl font-bold text-gray-800">{stats.recent}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Quick Actions</p>
                <p className="text-sm text-gray-500">Manage certificates</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              Add Certificate
            </button>
            
            <button
              onClick={() => router.push('/admin/bulk-upload')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Upload className="w-5 h-5" />
              Bulk Upload CSV
            </button>

            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>

            <button
              onClick={fetchCertificates}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email, name, event, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Certificates Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading certificates...</p>
            </div>
          ) : filteredCerts.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No certificates found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCerts.map((cert) => (
                    <tr key={cert.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-800">{cert.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{cert.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{cert.event_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{cert.date_of_event}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{cert.category}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(cert)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cert.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal will be added in next step */}
    </div>
  );
}
