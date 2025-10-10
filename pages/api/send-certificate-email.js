import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  try {
    // Get certificates from database
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .ilike('email', email.trim())
      .order('date_of_event', { ascending: false })

    if (error) throw error

    if (data.length === 0) {
      return res.status(404).json({ error: 'No certificates found' })
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    // Build certificate list for email
    const certificateList = data.map((cert, index) => `
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #eee;">
          <strong>${cert.name}</strong><br/>
          <span style="color: #666;">Event: ${cert.event_name}</span><br/>
          <span style="color: #666;">Date: ${cert.date_of_event}</span><br/>
          <span style="color: #666;">Category: ${cert.category}</span><br/>
          <a href="${cert.certificate_url}" style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Download Certificate</a>
        </td>
      </tr>
    `).join('')

    // Send email
    const mailOptions = {
      from: `"AMASI Certificates" <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject: `Your Certificate${data.length > 1 ? 's' : ''} - AMASI`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Your Certificates</h1>
              <p style="color: white; margin: 10px 0 0 0;">AMASI Certificate Portal</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                Hello,
              </p>
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                We found <strong>${data.length} certificate${data.length > 1 ? 's' : ''}</strong> associated with your email address. You can download ${data.length > 1 ? 'them' : 'it'} using the ${data.length > 1 ? 'links' : 'link'} below:
              </p>
              
              <!-- Certificates Table -->
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                ${certificateList}
              </table>
              
              <div style="margin-top: 30px; padding: 20px; background: #f0f9ff; border-left: 4px solid #2563eb; border-radius: 5px;">
                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                  <strong>💡 Tip:</strong> Please download and save your certificates for your records.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                This is an automated email from AMASI Certificate Portal.<br/>
                If you did not request this, please ignore this email.
              </p>
              <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} AMASI. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    await transporter.sendMail(mailOptions)

    res.status(200).json({ 
      success: true, 
      message: `Email sent successfully to ${email}`,
      certificateCount: data.length 
    })

  } catch (error) {
    console.error('Error sending email:', error)
    res.status(500).json({ error: 'Failed to send email' })
  }
}
