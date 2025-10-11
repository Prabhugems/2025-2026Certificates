import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get event ID from query parameter
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    // Fetch event from database
    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      return res.status(500).json({ 
        error: 'Failed to fetch event',
        details: error.message 
      });
    }

    return res.status(200).json({
      success: true,
      event
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
