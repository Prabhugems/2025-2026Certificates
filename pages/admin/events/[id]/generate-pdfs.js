import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { ArrowLeft, FileCheck, Loader } from 'lucide-react'
import jsPDF from 'jspdf'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function GeneratePDFs() {
  const router = useRouter()
  const { id } = router.query
  const [certificates, setCertificates] = useState([])
  const [templates, setTemplates] = useState({})
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [completed, setCompleted] = useState([])
  const [errors, setErrors] = useState([])
  const canvasRef = useRef(null)

  useEffect(() => {
    if (id) {
      fetchCertificates()
      fetchTemplates()
    }
  }, [id])

  const fetchCertificates = async () => {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('event_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCertificates(data || [])
    } catch (error) {
      console.error('Error fetching certificates:', error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('event_id', id)

      if (error) throw error
      
      const templateMap = {}
      data.forEach(template => {
        templateMap[template.category.toLowerCase()] = template
      })
      setTemplates(templateMap)
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const generatePDF = async (cert, template) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Create image element
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        img.onload = async () => {
          // Create canvas
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')
          
          // Set canvas size to match image
          canvas.width = img.width
          canvas.height = img.height
          
          // Draw template
          ctx.drawImage(img, 0, 0)
          
          // Configure text
          const fontSize = template.name_font_size || 48
          ctx.font = `${fontSize}px ${template.name_font_family || 'serif'}`
          ctx.fillStyle = template.name_font_color || '#000000'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          // Calculate position (convert percentage to pixels)
          const x = (template.name_position_x / 100) * canvas.width
          const y = (template.name_position_y / 100) * canvas.height
          
          // Draw name
          ctx.fillText(cert.name, x, y)
          
          // Convert canvas to blob
          canvas.toBlob(async (blob) => {
            try {
              // Create PDF
              const pdf = new jsPDF({
                orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
              })
              
              // Add image to PDF
              const imgData = canvas.toDataURL('image/png')
              pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
              
              // Convert PDF to blob
              const pdfBlob = pdf.output('blob')
              
              // Upload to Supabase Storage
              const filename = `certificates/${id}/${cert.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`
              
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('certificates')
                .upload(filename, pdfBlob, {
                  contentType: 'application/pdf',
                  upsert: false
                })
              
              if (uploadError) throw uploadError
              
              // Get public URL
              const { data: urlData } = supabase.storage
                .from('certificates')
                .getPublicUrl(filename)
              
              // Update certificate with new URL
              await supabase
                .from('certificates')
                .update({ certificate_url: urlData.publicUrl })
                .eq('id', cert.id)
              
              resolve(urlData.publicUrl)
            } catch (error) {
              reject(error)
            }
          }, 'image/png')
        }
        
        img.onerror = () => {
          reject(new Error('Failed to load template image'))
        }
        
        // Load template image
        img.src = template.template_url
      } catch (error) {
        reject(error)
      }
    })
  }

  const handleGenerateAll = async () => {
    setGenerating(true)
    setProgress({ current: 0, total: certificates.length })
    setCompleted([])
    setErrors([])

    for (let i = 0; i < certificates.length; i++) {
      const cert = certificates[i]
      
      try {
        const template = templates[cert.category.toLowerCase()]
        
        if (!template) {
          setErrors(prev => [...prev, `No template for ${cert.name} (${cert.category})`])
          continue
        }

        const pdfUrl = await generatePDF(cert, template)
        setCompleted(prev => [...prev, { name: cert.name, url: pdfUrl }])
        setProgress({ current: i + 1, total: certificates.length })
      } catch (error) {
        console.error(`Error generating PDF for ${cert.name}:`, error)
        setErrors(prev => [...prev, `Failed for ${cert.name}: ${error.message}`])
        setProgress({ current: i + 1, total: certificates.length })
      }
    }

    setGenerating(false)
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
            <h1 className="text-2xl font-bold text-gray-800">Generate PDFs</h1>
            <p className="text-sm text-gray-600 mt-1">Create personalized certificate PDFs</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">📋 What This Does</h3>
          <p className="text-sm text-blue-800">
            This will generate personalized PDF certificates for all {certificates.length} participants,
            with their names overlaid on the certificate templates. The PDFs will be uploaded to Supabase Storage.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <p className="text-sm text-gray-600">Total Certificates</p>
            <p className="text-2xl font-bold text-gray-800">{certificates.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <p className="text-sm text-gray-600">Available Templates</p>
            <p className="text-2xl font-bold text-gray-800">{Object.keys(templates).length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">{completed.length}</p>
          </div>
        </div>

        {/* Generate Button */}
        {!generating && completed.length === 0 && (
          <button
            onClick={handleGenerateAll}
            disabled={certificates.length === 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-lg mb-6"
          >
            <FileCheck className="w-6 h-6" />
            Generate {certificates.length} PDFs
          </button>
        )}

        {/* Progress */}
        {generating && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-gray-800">Generating PDFs...</span>
              <span className="text-gray-600">{progress.current} / {progress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">✅ Generated ({completed.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {completed.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-800">{item.name}</span>
                  
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    View PDF
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-red-800 mb-4">❌ Errors ({errors.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {errors.map((error, index) => (
                <div key={index} className="p-3 bg-red-50 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hidden canvas for rendering */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  )
}
