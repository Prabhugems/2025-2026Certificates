export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { password } = req.body

  if (!password) {
    return res.status(400).json({ error: 'Password is required' })
  }

  // Verify against environment variable
  if (password === process.env.ADMIN_PASSWORD) {
    // Generate a simple token (in production, use JWT)
    const token = Buffer.from(`admin:${Date.now()}`).toString('base64')
    
    res.status(200).json({ 
      success: true, 
      token,
      message: 'Login successful' 
    })
  } else {
    res.status(401).json({ error: 'Invalid password' })
  }
}
