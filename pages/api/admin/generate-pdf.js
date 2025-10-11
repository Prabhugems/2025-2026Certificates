import { createClient } from '@supabase/supabase-js';
import { createCanvas, loadImage } from 'canvas';
import PDFDocument from 'pdfkit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Helper function to generate PDF for a single certificate
async function generatePDF(name, template, eventId, category) {
  try {
    // Download template image
    const templateResponse = await fetch(template.template_url);
    if (!templateResponse.ok) {
      throw new Error('Failed to download template');
    }

    const templateBuffer = await templateResponse.arrayBuffer();
    const image = await loadImage(Buffer.from(templateBuffer));

    // Create canvas
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    // Draw template
    ctx.drawImage(image, 0, 0);

    // Configure text
    const fontSize = template.name_font_size || 48;
    const fontColor = template.name_font_color || '#000000';
    const fontFamily = template.name_font_family || 'Arial';
    
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = fontColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw name
    const nameX = template.name_position_x || image.width / 2;
    const nameY = template.name_position_y || image.height / 2;
    ctx.fillText(name, nameX, nameY);

    // Convert to PNG
    const pngBuffer = canvas.toBuffer('image/png');

    // Create PDF
    const pdfDoc = new PDFDocument({
      size: [image.width, image.height],
      margins: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    const chunks = [];
    pdfDoc.on('data', chunk => chunks.push(chunk));
    
    const pdfPromise = new Promise((resolve, reject) => {
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
    });

    pdfDoc.image(pngBuffer, 0, 0, {
      width: image.width,
      height: image.height
    });

    pdfDoc.end();

    const pdfBuffer = await pdfPromise;

    // Upload to Supabase Storage
    const fileName = `certificates/${eventId}/${category}_${name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    
    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('certificates')
      .getPublicUrl(fileName);

    return publicUrl;

  } catch (error) {
    console.error('PDF generation error for', name, ':', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event_id, participants } = req.body;

    if (!event_id || !participants || !Array.isArray(participants)) {
      return res.status(400).json({ 
        error: 'Invalid request. event_id and participants array required' 
      });
    }

    // Get all templates for this event
    const { data: templates, error: templatesError } = await supabase
      .from('certificate_templates')
      .select('*')
      .eq('event_id', event_id);

    if (templatesError) {
      return res.status(500).json({ error: 'Failed to fetch templates' });
    }

    if (!templates || templates.length === 0) {
      return res.status(400).json({ 
        error: 'No templates found for this event. Please upload templates first.' 
      });
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const results = {
      success: [],
      failed: []
    };

    // Process each participant
    for (const participant of participants) {
      try {
        const { email, name, category } = participant;

        if (!email || !name || !category) {
          results.failed.push({
            participant,
            error: 'Missing required fields'
          });
          continue;
        }

        // Find matching template
        const template = templates.find(
          t => t.category.toLowerCase() === category.toLowerCase()
        );

        if (!template) {
          results.failed.push({
            participant,
            error: `No template found for category: ${category}`
          });
          continue;
        }

        // Generate PDF
        const pdfUrl = await generatePDF(name, template, event_id, category);

        // Insert certificate record
        const { data: cert, error: insertError } = await supabase
          .from('certificates')
          .insert({
            email: email.toLowerCase().trim(),
            name: name.trim(),
            event_name: event.event_name,
            date_of_event: event.event_date,
            category: category.trim(),
            certificate_url: pdfUrl,
            event_id: parseInt(event_id),
            tags: null
          })
          .select()
          .single();

        if (insertError) {
          results.failed.push({
            participant,
            error: insertError.message
          });
        } else {
          results.success.push({
            participant,
            certificateId: cert.id,
            pdfUrl
          });
        }

      } catch (error) {
        results.failed.push({
          participant,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      message: 'Certificate generation completed',
      total: participants.length,
      successful: results.success.length,
      failed: results.failed.length,
      results
    });

  } catch (error) {
    console.error('Certificate generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate certificates',
      details: error.message 
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
