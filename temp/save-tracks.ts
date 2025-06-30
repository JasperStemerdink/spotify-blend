import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) return res.status(401).json({ error: 'Not logged in' })

    const accessToken = session.provider_token
    const topRes = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=50', {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    })

    const { items } = await topRes.json()

    const tracks = items.map((track: any) => ({
        track_id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        image: track.album.images[0]?.url ?? null,
        user_id: session.user.id
    }))

    // Optional: Save to Supabase DB (if you’ve created user_tracks table)
    await supabase.from('user_tracks').insert(tracks)

    res.status(200).json({ tracks })
    } catch (err) {
        console.error("Unhandled API error:", err)
        res.status(500).json({ error: 'Internal Server Error', details: err })
    }
}
