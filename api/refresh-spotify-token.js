// This API route refreshes a Spotify access token using a stored refresh token
export default async function handler(req, res) {
    const { refresh_token } = req.body;

    if (!refresh_token) {
        return res.status(400).json({ error: "Missing refresh_token" });
    }

    // Prepare the request body for Spotify's token endpoint
    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refresh_token);

    // Spotify requires client credentials to be sent as base64-encoded string
    const basic = Buffer.from(
        `28d84e1ba0ea4def8500de4badbf00bb:01628cdb170d40ea9e702af5659be6da`
    ).toString("base64");

    try {
        // Make a POST request to Spotify to refresh the access token
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

        return res.status(200).json(data); // Return refreshed token
    } catch (err) {
        console.error("Error refreshing token", err);
        return res.status(500).json({ error: "Internal error", details: err });
    }
}
