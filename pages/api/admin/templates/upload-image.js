import { createClient } from '@supabase/supabase-js'
import formidable from 'formidable'
import fs from 'fs'

// Disable default body parser
export const config = {
  api: {
    bodyParser: false,
  },
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Parse the multipart form data
    const form = formidable({ multiples: false })
    
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        resolve([fields, files])
      })
    })

    const file = files.file?.[0] || files.file
    const event_id = fields.event_id?.[0] || fields.event_id
    const category = fields.category?.[0] || fields.category

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Read file
    const fileData = fs.readFileSync(file.filepath)
    const fileName = `templates/${event_id}/${category}_${Date.now()}.${file.originalFilename.split('.').pop()}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('certificates')
      .upload(fileName, fileData, {
        contentType: file.mimetype,
        upsert: false
      })

    if (error) {
      console.error('Supabase storage error:', error)
      throw error
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('certificates')
      .getPublicUrl(fileName)

    // Clean up temp file
    fs.unlinkSync(file.filepath)

    res.status(200).json({ 
      success: true,
      url: urlData.publicUrl,
      path: fileName
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    res.status(500).json({ error: 'Failed to upload image' })
  }
}
