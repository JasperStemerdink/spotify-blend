// Dashboard where users can create or join sessions
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [sessionName, setSessionName] = useState("");
    const [openSessions, setOpenSessions] = useState<any[]>([]);
    const router = useRouter();

    // Check auth + refresh token on mount
    useEffect(() => {
        const checkAndRefreshToken = async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            const currentUser = (await supabase.auth.getUser()).data?.user;
            if (!sessionData?.session || !currentUser) return;

            const metadata = currentUser.user_metadata;
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
                }
            }

            setUser(currentUser);
        };

        checkAndRefreshToken();
    }, []);

    // Load all open sessions
    useEffect(() => {
        const fetchSessions = async () => {
            const { data, error } = await supabase
                .from("sessions")
                .select("id, name, created_at")
                .eq("session_mode", 1)
                .is("session_id", null); // Only top-level sessions

            if (!error) setOpenSessions(data);
        };

        fetchSessions();
    }, []);

    // Create a new session
    const createSession = async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from("sessions")
            .insert([
                {
                    name: sessionName,
                    host_user_id: user.id,
                    session_mode: 1,
                },
            ])
            .select()
            .single();

        if (!error) router.push(`/session/${data.id}`);
    };

    // Join an existing session
    const joinSession = async (sessionId: string) => {
        if (!user) return;

        const { data, error } = await supabase
            .from("sessions")
            .insert([
                {
                    host_user_id: user.id,
                    session_mode: 1,
                    session_id: sessionId, // link to existing session
                },
            ])
            .select()
            .single();

        if (!error) router.push(`/session/${sessionId}`);
    };

    return (
        <div>
            <h1>Welcome, {user?.email}</h1>

            <div>
                <h2>Create a Session</h2>
                <input
                    type="text"
                    placeholder="Session name"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                />
                <button onClick={createSession}>Create</button>
            </div>

            <div>
                <h2>Open Sessions</h2>
                {openSessions.length === 0 ? (
                    <p>No open sessions found.</p>
                ) : (
                    <ul>
                        {openSessions.map((session) => (
                            <li key={session.id}>
                                <strong>{session.name || "Unnamed session"}</strong>
                                <br />
                                <button onClick={() => joinSession(session.id)}>Join</button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
