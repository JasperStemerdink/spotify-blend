const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const { sessionId } = req.body;

    if (!token || !sessionId) {
        return res.status(400).json({ error: "Missing token or sessionId" });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
        return res.status(401).json({ error: "Invalid token" });
    }

    const spotifyToken = user.user_metadata?.spotify_access_token;
    if (!spotifyToken) {
        return res.status(400).json({ error: "No Spotify token found" });
    }

    const spotifyRes = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=50", {
        headers: { Authorization: `Bearer ${spotifyToken}` },
    });

    if (!spotifyRes.ok) {
        const errorData = await spotifyRes.json();
        console.error("Spotify error:", errorData);
        return res.status(500).json({ error: "Spotify error", details: errorData });
    }

    const { items } = await spotifyRes.json();
    if (!items) {
        return res.status(500).json({ error: "Spotify response invalid" });
    }

    const tracks = items.map((track) => ({
        track_id: track.id,
        track_name: track.name,
        artist_name: track.artists[0].name,
        album_image_url: track.album.images[0]?.url ?? null,
        user_id: user.id,
        session_id: sessionId,
    }));

    const { error } = await supabase.from("user_tracks").insert(tracks);
    if (error) {
        console.error("Supabase insert error:", error);
        return res.status(500).json({ error: "DB insert failed", details: error });
    }

    res.status(200).json({ tracks });
};
