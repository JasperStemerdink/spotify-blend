import { supabase } from '@/lib/supabase'

export default function Home() {
    const signIn = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'spotify',
        })
    }

    return (
        <main>
            <h1>Spotify Blend</h1>
            <button onClick={signIn}>Login with Spotify</button>
        </main>
    )
}
