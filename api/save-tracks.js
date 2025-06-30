const { supabase } = require('../lib/supabase');

module.exports = async function handler(req, res) {
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            console.error("Error getting session:", sessionError);
            return res.status(500).json({ error: 'Failed to get session' });
        }

        if (!session) {
            return res.status(401).json({ error: 'Not logged in' });
        }

        const accessToken = session.provider_token;
        if (!accessToken) {
            return res.status(401).json({ error: 'No Spotify token found' });
        }

        const topRes = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=50', {
            headers: {
                Authorization: `Bearer ${accessToken}`
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
            user_id: session.user.id
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
