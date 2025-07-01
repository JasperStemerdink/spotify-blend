// app/session/[id]/page.tsx
"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export default function SessionPage() {
    const { id: sessionId } = useParams<{ id: string }>();
    const [user, setUser] = useState<User | null>(null);
    const [tracks, setTracks] = useState<any[]>([]);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
    }, []);

    useEffect(() => {
        const fetchAndInsertTracks = async () => {
            const { data: session } = await supabase.auth.getSession();
            if (!session || !session.session) return;

            const res = await fetch("/api/save-tracks-to-session", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.session.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ session_id: sessionId }),
            });

            const result = await res.json();
            if (!res.ok) {
                console.error("Error saving tracks:", result);
            }
        };

        const fetchTracks = async () => {
            const { data, error } = await supabase
                .from("user_tracks")
                .select("*")
                .eq("session_id", sessionId);

            if (error) console.error("Error fetching tracks:", error);
            else setTracks(data ?? []);
        };

        if (user) {
            fetchAndInsertTracks().then(fetchTracks);
        }
    }, [user, sessionId]);

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
