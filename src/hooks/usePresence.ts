import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserPresence {
  user_id: string;
  is_online: boolean;
  last_seen: string;
}

export const usePresence = () => {
  const [presenceMap, setPresenceMap] = useState<Record<string, UserPresence>>({});
  const { user } = useAuth();

  // Update own presence
  const updatePresence = useCallback(async (isOnline: boolean) => {
    if (!user) return;
    
    const { error } = await supabase
      .from("user_presence")
      .upsert({
        user_id: user.id,
        is_online: isOnline,
        last_seen: new Date().toISOString(),
      }, { onConflict: "user_id" });
    
    return error;
  }, [user]);

  // Set online on mount, offline on unmount
  useEffect(() => {
    if (!user) return;

    // Set online
    updatePresence(true);

    // Heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
      updatePresence(true);
    }, 30000);

    // Set offline on page unload
    const handleUnload = () => {
      navigator.sendBeacon && navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_presence?user_id=eq.${user.id}`,
        JSON.stringify({ is_online: false, last_seen: new Date().toISOString() })
      );
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener("beforeunload", handleUnload);
      updatePresence(false);
    };
  }, [user, updatePresence]);

  // Subscribe to presence changes
  useEffect(() => {
    const channel = supabase
      .channel("presence-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_presence" },
        (payload) => {
          const data = payload.new as UserPresence;
          if (data?.user_id) {
            setPresenceMap((prev) => ({
              ...prev,
              [data.user_id]: data,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Fetch initial presence for specific users
  const fetchPresence = useCallback(async (userIds: string[]) => {
    if (userIds.length === 0) return;
    
    const { data } = await supabase
      .from("user_presence")
      .select("*")
      .in("user_id", userIds);
    
    if (data) {
      const map: Record<string, UserPresence> = {};
      data.forEach((p) => {
        map[p.user_id] = p as UserPresence;
      });
      setPresenceMap((prev) => ({ ...prev, ...map }));
    }
  }, []);

  const isOnline = (userId: string) => {
    const presence = presenceMap[userId];
    if (!presence) return false;
    
    // Consider online if last seen within 60 seconds
    const lastSeen = new Date(presence.last_seen).getTime();
    const now = Date.now();
    return presence.is_online && (now - lastSeen) < 60000;
  };

  const getLastSeen = (userId: string) => {
    return presenceMap[userId]?.last_seen;
  };

  return { presenceMap, fetchPresence, isOnline, getLastSeen, updatePresence };
};
