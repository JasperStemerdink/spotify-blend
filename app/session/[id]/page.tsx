// Displays the session page and fetches/saves user’s top tracks to the session
"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export default function SessionPage() {
    const { id: sessionId } = useParams<{ id: string }>();
    const [user, setUser] = useState<User | null>(null);
    const [tracks, setTracks] = useState<any[]>([]);

    // Get current user
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
    }, []);

    // Fetch and save tracks on page load
    useEffect(() => {
        const fetchAndInsertTracks = async () => {
            const { data: session } = await supabase.auth.getSession();
            const { data: userData } = await supabase.auth.getUser();

            if (!session || !session.session || !userData?.user) return;

            const spotifyAccessToken = await refreshSpotifyTokenIfNeeded(userData.user);
            if (!spotifyAccessToken) return;

            // Save tracks via API
            await fetch("/api/save-tracks-to-session", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.session.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    spotify_access_token: spotifyAccessToken,
                }),
            });

        };

        // Fetch tracks for display
        const fetchTracks = async () => {
            const { data, error } = await supabase
                .from("user_tracks")
                .select("*")
                .eq("session_id", sessionId);

            if (!error) setTracks(data ?? []);
        };

        if (user) {
            fetchAndInsertTracks().then(fetchTracks);
        }
    }, [user, sessionId]);

    // Refresh token if expired
    const refreshSpotifyTokenIfNeeded = async (user: User) => {
        const metadata = user.user_metadata;
        const expiry = metadata?.spotify_expires_at;
        const refreshToken = metadata?.spotify_refresh_token;
        const now = Math.floor(Date.now() / 1000);

        if (expiry && now >= expiry - 60 && refreshToken) {
            const res = await fetch("/api/refresh-spotify-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            const refreshed = await res.json();
            if (res.ok) {
                await supabase.auth.updateUser({
                    data: {
                        spotify_access_token: refreshed.access_token,
                        spotify_expires_at: now + refreshed.expires_in,
                    },
                });
                return refreshed.access_token;
            }
        }

        return metadata?.spotify_access_token;
    };

    return (
        <div>
            <h1>Session Tracks</h1>
            <ul>
                {tracks.map((track) => (
                    <li key={track.id}>
                        {track.track_name} – {track.artist_name}
                    </li>
                ))}
            </ul>
        </div>
    );
}
