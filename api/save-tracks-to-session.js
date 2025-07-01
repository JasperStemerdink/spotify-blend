// pages/api/save-tracks-to-session.js
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const { session_id } = req.body;

    if (!token || !session_id) {
        return res.status(400).json({ error: "Missing token or session_id" });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
        return res.status(401).json({ error: "Invalid token" });
    }

    try {
        const topRes = await fetch(
            "https://api.spotify.com/v1/me/top/tracks?limit=50",
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const { items } = await topRes.json();

        const tracks = items.map((track) => ({
            track_id: track.id,
            track_name: track.name,
            artist_name: track.artists[0]?.name ?? "Unknown",
            album_image_url: track.album.images[0]?.url ?? null,
            user_id: user.id,
            session_id,
        }));

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
