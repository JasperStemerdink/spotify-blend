// app/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [sessionName, setSessionName] = useState("");
  const [joinSessionId, setJoinSessionId] = useState("");
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
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

  const joinSession = () => {
    if (joinSessionId) {
      router.push(`/session/${joinSessionId}`);
    }
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
          <h2>Join a Session</h2>
          <input
              type="text"
              placeholder="Session ID"
              value={joinSessionId}
              onChange={(e) => setJoinSessionId(e.target.value)}
          />
          <button onClick={joinSession}>Join</button>
        </div>
      </div>
  );
}
