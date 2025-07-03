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

    useEffect(() => {
        const checkAndRefreshToken = async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            const currentUser = (await supabase.auth.getUser()).data?.user;
            if (!sessionData || !sessionData.session || !currentUser) return;

            const metadata = currentUser.user_metadata;
            const token = metadata?.spotify_access_token;
            const expiry = metadata?.spotify_expires_at;
            const refreshToken = metadata?.spotify_refresh_token;

            const now = Math.floor(Date.now() / 1000);

            // Refresh if expired or about to expire
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
                } else {
                    console.error("Failed to refresh token", refreshed);
                }
            }

            setUser(currentUser);
        };

        checkAndRefreshToken();
    }, []);

    useEffect(() => {
        const fetchSessions = async () => {
            const { data, error } = await supabase
                .from("sessions")
                .select("id, name, created_at")
                .eq("session_mode", 1)
                .is("session_id", null); // Only top-level sessions

            if (error) {
                console.error("Error fetching sessions:", error);
            } else {
                setOpenSessions(data);
            }
        };

        fetchSessions();
    }, []);

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

        if (error) {
            console.error("Error creating session:", error);
            return;
        }

        router.push(`/session/${data.id}`);
    };

    const joinSession = async (sessionId: string) => {
        if (!user) return;

        const { data, error } = await supabase
            .from("sessions")
            .insert([
                {
                    host_user_id: user.id,
                    session_mode: 1,
                    session_id: sessionId, // joins existing session
                },
            ])
            .select()
            .single();

        if (error) {
            console.error("Error joining session:", error);
            return;
        }

        router.push(`/session/${sessionId}`);
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
                            <li key={session.id} style={{ marginBottom: "1rem" }}>
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
