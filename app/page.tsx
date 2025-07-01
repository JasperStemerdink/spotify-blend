"use client";
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js';

export default function Dashboard() {

  type Track = {
    id: string;
    name: string;
    artist: string;
    image: string;
  };

  const [user, setUser] = useState<User | null>(null)
  const [tracks, setTracks] = useState<Track[]>([]);

  useEffect(() => {
    const syncUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return;

      setUser(user);

      // Try to insert the user (do nothing if already exists)
      await supabase
          .from('users')
          .upsert({
            id: user.id,
            spotify_id: user.user_metadata?.user_name, // depends on Spotify fields
            display_name: user.user_metadata?.full_name || user.email,
          }, { onConflict: 'id' });
    }

    syncUser();
  }, []);


  useEffect(() => {
    const saveSpotifyToken = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.provider_token && session.user) {
        // Save Spotify token in user metadata
        const { error } = await supabase.auth.updateUser({
          data: { spotify_access_token: session.provider_token },
        });
        if (error) console.error("Error saving Spotify token:", error);
      }
    };

    saveSpotifyToken();
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user))
  }, [])

  useEffect(() => {
    const fetchTopTracks = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (!session) {
        console.error('No session found:', error);
        return;
      }

      const res = await fetch('/api/save-tracks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const json = await res.json();

      if (!res.ok) {
        console.error('API error:', json.error || 'Unknown error');
        return;
      }

      if (!json.tracks || !Array.isArray(json.tracks)) {
        console.error('Invalid response:', json);
        return;
      }

      setTracks(json.tracks);
    };

    if (user) fetchTopTracks();
  }, [user]);


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