import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Notification } from "@/types";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(30);

    if (!error && data) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
    }
  }, []);

  useEffect(() => {
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      const uid = session.user.id;
      setUserId(uid);
      fetchNotifications(uid);

      // Real-time subscription — listen for new notifications inserted for this user
      realtimeChannel = supabase
        .channel(`notifications:${uid}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${uid}`,
          },
          (payload) => {
            const newNotif = payload.new as Notification;
            setNotifications((prev) => [newNotif, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        )
        .subscribe();
    });

    return () => {
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    };
  }, [fetchNotifications]);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [userId]);

  const markOneRead = useCallback(async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  return { notifications, unreadCount, markAllRead, markOneRead };
};

// ── Helper: send a notification to a specific user ──────────────────────────
export const sendNotification = async (
  userId: string,
  title: string,
  message: string,
  type: "info" | "success" | "warning" = "info",
  complaintId?: string
) => {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    complaint_id: complaintId ?? null,
  });
  if (error) console.error("Failed to send notification:", error.message);
};

// ── Helper: notify every admin in the system ─────────────────────────────────
export const notifyAllAdmins = async (
  title: string,
  message: string,
  complaintId?: string
) => {
  // Fetch all users whose role metadata = Admin
  // We use the profiles table (or user_metadata) — query auth.users is not allowed from client,
  // so we use a "profiles" or "user_roles" table if available.
  // Fallback: use a DB function or a dedicated admins view.
  // Here we use the standard pattern: store roles in a public profiles table.
  const { data: admins, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "Admin");

  if (error) {
    console.error("Could not fetch admins:", error.message);
    return;
  }

  if (!admins || admins.length === 0) return;

  const rows = admins.map((a: { id: string }) => ({
    user_id: a.id,
    title,
    message,
    type: "info",
    complaint_id: complaintId ?? null,
  }));

  const { error: insertError } = await supabase.from("notifications").insert(rows);
  if (insertError) console.error("Failed to notify admins:", insertError.message);
};
