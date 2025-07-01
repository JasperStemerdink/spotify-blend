const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    "https://mjtwikohjkfngnadmumr.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdHdpa29oamtmbmduYWRtdW1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExODM2NSwiZXhwIjoyMDY2Njk0MzY1fQ.q_Nl4CNPd_of2wz2NCigWUHqi1e9s1C4P_BFLpTdtu8"
);

module.exports = async function handler(req, res) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
        console.error('Token verification failed:', userError);
        return res.status(401).json({ error: 'Invalid token' });
    }

    const spotifyToken = user.user_metadata?.spotify_access_token;

    if (!spotifyToken) {
        return res.status(400).json({ error: 'No Spotify access token found in metadata' });
    }

    try {

        const topRes = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=50', {
            headers: {
                Authorization: `Bearer ${spotifyToken}`
            }
        });

        if (!topRes.ok) {
            const errorData = await topRes.json();
            console.error("Spotify API error:", errorData);
            return res.status(500).json({ error: 'Spotify API error', details: errorData });
        }

        const { items } = await topRes.json();

        const tracks = items.map(track => ({
            track_id: track.id,
            name: track.name,
            artist: track.artists[0].name,
            image: track.album.images[0]?.url ?? null,
            user_id: user.id
        }));

        const { error } = await supabase.from('user_tracks').insert(tracks);
        if (error) {
            console.error("Supabase insert error:", error);
            return res.status(500).json({ error: 'DB insert failed', details: error });
        }

        res.status(200).json({ tracks });
    } catch (err) {
        console.error("Unhandled API error:", err);
        res.status(500).json({ error: 'Internal Server Error', details: err });
    }
};