"use client";

import { supabase } from '@/lib/supabase'

export default function Home() {
    const signIn = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'spotify',
            options: {
                scopes: 'user-top-read',
            },
        });
    }

    return (
        <main>
            <h1>Spotify Blend</h1>
            <button onClick={signIn}>Login with Spotify</button>
            <button onClick={() => supabase.auth.signOut()}>Log out</button>
        </main>
    )
}
