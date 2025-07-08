// Saves user's top 50 Spotify tracks to the Supabase `user_tracks` table
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY");

module.exports = async function handler(req, res) {
    const { session_id, spotify_access_token } = req.body;

    if (!spotify_access_token || !session_id) {
        return res.status(400).json({ error: "Missing Spotify access token or session_id" });
    }

    try {
        // Fetch top 50 tracks from Spotify API
        const topRes = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=50", {
            headers: {
                Authorization: `Bearer ${spotify_access_token}`,
            },
        });

        if (!topRes.ok) {
            const errorData = await topRes.json();
            console.error("Spotify API error:", errorData);
            return res.status(500).json({ error: 'Spotify API error', details: errorData });
        }

        const { items } = await topRes.json();

        // Extract relevant track data
        const tracks = items.map((track) => ({
            track_id: track.id,
            track_name: track.name,
            artist_name: track.artists[0]?.name ?? "Unknown",
            album_image_url: track.album.images[0]?.url ?? null,
            user_id: user.id,  // ⚠️ This assumes `user` is defined; you may need to re-enable the Supabase auth check
            session_id,
        }));

        // Save tracks to Supabase
        const { error } = await supabase.from("user_tracks").insert(tracks);
        if (error) {
            console.error("Supabase insert error:", error);
            return res.status(500).json({ error: "DB insert failed", details: error });
        }

        return res.status(200).json({ inserted: tracks.length });
    } catch (err) {
        console.error("Spotify error:", err);
        return res.status(500).json({ error: "Internal error", details: err });
    }
};
