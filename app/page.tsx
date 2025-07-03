"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [joinedSession, setJoinedSession] = useState(null);

    // Fetch user on mount
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUser(data?.user);
        });
    }, []);

    // Fetch open sessions
    useEffect(() => {
        const fetchSessions = async () => {
            const { data, error } = await supabase
                .from("sessions")
                .select("id, name")
                .eq("session_mode", 1);

            if (error) {
                console.error("Error fetching sessions:", error);
            } else {
                setSessions(data);
            }
        };

        fetchSessions();
    }, []);

    // Join a session
    const joinSession = async (sessionId: string) => {
        setJoinedSession(sessionId);

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!session || sessionError) {
            console.error("No session or error:", sessionError);
            return;
        }

        const res = await fetch("/api/save-tracks-to-session", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ sessionId }),
        });

        const json = await res.json();

        if (!res.ok) {
            console.error("API error:", json.error || "Unknown error");
            return;
        }

        setTracks(json.tracks);
    };

    return (
        <div>
            <h2>Welcome, {user?.email}</h2>

            <h3>Open Sessions</h3>
            <ul>
                {sessions.map((session) => (
                    <li key={session.id}>
                        {session.name || "Unnamed Session"}
                        <button onClick={() => joinSession(session.id)} style={{ marginLeft: 10 }}>
                            Join
                        </button>
                    </li>
                ))}
            </ul>

            {joinedSession && (
                <>
                    <h3>Your Tracks in Session</h3>
                    <ul>
                        {tracks.map((track) => (
                            <li key={track.id}>
                                {track.track_name} – {track.artist_name}
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}
