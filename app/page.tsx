'use client';

import { useEffect, useState } from 'react';
import { createSupabaseServerClient  } from "@/lib/supabase";
import { useRouter } from 'next/navigation';
import type { Database } from '@/types_db';

export default function Dashboard() {
    const supabase = createSupabaseServerClient();
    const router = useRouter();

    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch user session and token
    useEffect(() => {
        const fetchData = async () => {
            const {
                data: { session },
                error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError) {
                setError('Could not fetch session.');
                setLoading(false);
                return;
            }

            const token = session?.user?.user_metadata?.provider_token;

            if (!token) {
                setError('No Spotify access token found.');
                setLoading(false);
                return;
            }

            const sessionIdFromStorage = localStorage.getItem('session_id');

            if (!sessionIdFromStorage) {
                setError('No session_id found in localStorage.');
                setLoading(false);
                return;
            }

            setAccessToken(token);
            setSessionId(sessionIdFromStorage);

            // Call save endpoint
            try {
                const response = await fetch('/api/save-tracks-to-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        accessToken: token,
                        session_id: sessionIdFromStorage,
                    }),
                });

                const result = await response.json();

                if (!response.ok) {
                    setError(result.error || 'Error saving tracks.');
                    setLoading(false);
                    return;
                }

                // Redirect to session page
                router.push(`/session/${sessionIdFromStorage}`);
            } catch (err) {
                setError('Something went wrong while saving tracks.');
                setLoading(false);
            }
        };

        fetchData();
    }, [supabase, router]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-red-600">Error: {error}</p>;

    return null;
}
