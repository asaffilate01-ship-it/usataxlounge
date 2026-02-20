import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
}

export const useMessages = (otherUserId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (otherUserId) {
      query = query.or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
      );
    }

    const { data } = await query;
    if (data) setMessages(data as Message[]);
    setLoading(false);
  }, [user, otherUserId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`messages:${user.id}:${otherUserId || "all"}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Only add if relevant to this conversation
          if (otherUserId) {
            const isRelevant =
              (newMsg.sender_id === user.id && newMsg.receiver_id === otherUserId) ||
              (newMsg.sender_id === otherUserId && newMsg.receiver_id === user.id);
            if (!isRelevant) return;
          } else {
            const isRelevant = newMsg.sender_id === user.id || newMsg.receiver_id === user.id;
            if (!isRelevant) return;
          }
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, otherUserId]);

  const sendMessage = async (receiverId: string, content: string, attachment?: { url: string; name: string; type: string }) => {
    if (!user || (!content.trim() && !attachment)) return;
    const insertData: any = {
      sender_id: user.id,
      receiver_id: receiverId,
      content: content.trim() || (attachment ? `📎 ${attachment.name}` : ''),
    };
    if (attachment) {
      insertData.attachment_url = attachment.url;
      insertData.attachment_name = attachment.name;
      insertData.attachment_type = attachment.type;
    }
    const { error } = await supabase.from("messages").insert(insertData);
    return error;
  };

  const markAsRead = async (messageId: string) => {
    await supabase.from("messages").update({ read: true }).eq("id", messageId);
  };

  const markConversationRead = async (senderId: string) => {
    if (!user) return;
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", senderId)
      .eq("receiver_id", user.id)
      .eq("read", false);
  };

  return { messages, loading, sendMessage, markAsRead, markConversationRead, refetch: fetchMessages };
};
