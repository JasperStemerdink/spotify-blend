"use client";
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js';

export default function Dashboard() {
    const [user, setUser] = useState<User | null>(null)
    const [tracks, setTracks] = useState([])

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data?.user))
    }, [])

    useEffect(() => {
        const fetchTopTracks = async () => {
            const res = await fetch('/api/save-tracks') // This hits your API route
            const json = await res.json()
            setTracks(json.tracks)
        }

        if (user) fetchTopTracks()
    }, [user])

    return (
        <div>
            <h2>Welcome, {user?.email}</h2>
            <h3>Your Top Tracks</h3>
            <ul>
                {tracks.map(track => (
                    <li key={track.id}>{track.name} – {track.artist}</li>
                ))}
            </ul>
        </div>
    )
}
