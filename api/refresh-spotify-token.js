// pages/api/refresh-spotify-token.js
export default async function handler(req, res) {
    const { refresh_token } = req.body;

    if (!refresh_token) {
        return res.status(400).json({ error: "Missing refresh_token" });
    }

    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refresh_token);

    const basic = Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    try {
        const spotifyRes = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                Authorization: `Basic ${basic}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        });

        const data = await spotifyRes.json();

        if (!spotifyRes.ok) {
            return res.status(500).json({ error: "Spotify token refresh failed", details: data });
        }

        return res.status(200).json(data);
    } catch (err) {
        console.error("Error refreshing token", err);
        return res.status(500).json({ error: "Internal error", details: err });
    }
}
