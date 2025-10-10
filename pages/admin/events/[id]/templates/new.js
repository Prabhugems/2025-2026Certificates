import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Upload, Save, Image as ImageIcon } from 'lucide-react';

export default function NewTemplate() {
  const router = useRouter();
  const { id } = router.query;
  const [category, setCategory] = useState('');
  const [templateFile, setTemplateFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  // Position configuration
  const [namePosition, setNamePosition] = useState({ x: 0, y: 0 });
  const [showPositionTool, setShowPositionTool] = useState(false);
  const imageRef = useRef(null);

  const categories = [
    'Delegate',
    'Faculty',
    'Speaker',
    'Volunteer',
    'Organizer',
    'Participant'
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setTemplateFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setShowPositionTool(false);
      setError('');
    } else {
      setError('Please select a valid image file (PNG, JPG)');
    }
  };

  const handleImageClick = (e) => {
    if (!showPositionTool) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate percentage positions (for responsive positioning)
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    
    setNamePosition({ x: Math.round(xPercent), y: Math.round(yPercent) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!templateFile) {
      setError('Please select a template image');
      return;
    }

    if (!category) {
      setError('Please select a category');
      return;
    }

    if (namePosition.x === 0 && namePosition.y === 0) {
      setError('Please click on the image to set the name position');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // First, upload the image to Supabase Storage
      const formData = new FormData();
      formData.append('file', templateFile);
      formData.append('event_id', id);
      formData.append('category', category);

      const uploadResponse = await fetch('/api/admin/templates/upload-image', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Failed to upload image');
      }

      // Then save template info to database
      const saveResponse = await fetch('/api/admin/templates/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: id,
          category,
          template_url: uploadData.url,
          name_position_x: namePosition.x,
          name_position_y: namePosition.y,
          name_font_size: 48,
          name_font_color: '#000000',
          name_font_family: 'serif'
        }),
      });

      const saveData = await saveResponse.json();

      if (!saveResponse.ok) {
        throw new Error(saveData.error || 'Failed to save template');
      }

      alert('Template uploaded successfully!');
      router.push(`/admin/events/${id}`);
    } catch (err) {
      setError(err.message || 'Error uploading template');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push(`/admin/events/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Event
          </button>
          <div className="flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Upload Certificate Template</h1>
              <p className="text-sm text-gray-600">Upload PNG and configure text position</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Left Column - Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* Category Selection */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Template Details</h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="">Select category...</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate Template (PNG/JPG) <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleFileChange}
                      className="hidden"
                      id="template-upload"
                      required
                    />
                    <label htmlFor="template-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-1">
                        {templateFile ? templateFile.name : 'Click to upload template'}
                      </p>
                      <p className="text-sm text-gray-500">PNG or JPG (recommended: 1920x1080 or A4 size)</p>
                    </label>
                  </div>
                </div>
              </div>

              {/* Position Configuration */}
              {previewUrl && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Configure Name Position</h2>
                  
                  {!showPositionTool ? (
                    <button
                      type="button"
                      onClick={() => setShowPositionTool(true)}
                      className="w-full py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium"
                    >
                      Click to Set Name Position
                    </button>
                  ) : (
                    <div>
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                        <p className="text-sm text-blue-800">
                          <strong>Click on the image</strong> where you want the participant's name to appear.
                        </p>
                      </div>
                      
                      {namePosition.x > 0 && namePosition.y > 0 && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                          <p className="text-sm text-green-800">
                            ✓ Name position set at: {namePosition.x}%, {namePosition.y}%
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">
                      <strong>Font Settings:</strong> Default: 48px, Black, Serif font
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Preview */}
            <div>
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Preview</h2>
                
                {previewUrl ? (
                  <div className="relative">
                    <img
                      ref={imageRef}
                      src={previewUrl}
                      alt="Template preview"
                      onClick={handleImageClick}
                      className={`w-full rounded-lg ${showPositionTool ? 'cursor-crosshair' : ''}`}
                    />
                    
                    {/* Position marker */}
                    {namePosition.x > 0 && namePosition.y > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${namePosition.x}%`,
                          top: `${namePosition.y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                        className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg"
                      />
                    )}
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Upload a template to see preview</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Template
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/admin/events/${id}`)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
