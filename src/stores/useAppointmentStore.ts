import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Appointment {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  provider: string;
  type: string;
  reason: string;
  notes: string;
  labResults: string;
  followUpActions: string;
  nextAppointmentDate: string; // YYYY-MM-DD or ""
  isPast: boolean;
}

const APPOINTMENT_TYPES = [
  "GP / Primary Care",
  "Specialist",
  "Therapist / Counselor",
  "Nutritionist / Dietitian",
  "Dentist",
  "Physiotherapist",
  "Gynecologist",
  "Other",
];

async function getUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

function rowToAppointment(row: any): Appointment {
  return {
    id: row.id,
    date: row.date,
    time: row.time || "",
    provider: row.provider || "",
    type: row.type || "",
    reason: row.reason || "",
    notes: row.notes || "",
    labResults: row.lab_results || "",
    followUpActions: row.follow_up_actions || "",
    nextAppointmentDate: row.next_appointment_date || "",
    isPast: row.date < new Date().toISOString().slice(0, 10),
  };
}

export function useAppointmentStore() {
  const [appointments, setAppointmentsState] = useState<Appointment[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load from cloud on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const userId = await getUserId();
      if (!userId || cancelled) return;
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: true });
      if (!cancelled && data) {
        setAppointmentsState(data.map(rowToAppointment));
        setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const addAppointment = useCallback(async (appt: Appointment) => {
    setAppointmentsState((prev) => [...prev, appt]);
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from("appointments").insert({
      id: appt.id,
      user_id: userId,
      date: appt.date,
      time: appt.time,
      provider: appt.provider,
      type: appt.type,
      reason: appt.reason,
      notes: appt.notes,
      lab_results: appt.labResults,
      follow_up_actions: appt.followUpActions,
      next_appointment_date: appt.nextAppointmentDate,
    });
  }, []);

  const updateAppointment = useCallback(async (updated: Appointment) => {
    setAppointmentsState((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from("appointments").update({
      date: updated.date,
      time: updated.time,
      provider: updated.provider,
      type: updated.type,
      reason: updated.reason,
      notes: updated.notes,
      lab_results: updated.labResults,
      follow_up_actions: updated.followUpActions,
      next_appointment_date: updated.nextAppointmentDate,
    }).eq("id", updated.id).eq("user_id", userId);
  }, []);

  const deleteAppointment = useCallback(async (id: string) => {
    setAppointmentsState((prev) => prev.filter((a) => a.id !== id));
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from("appointments").delete().eq("id", id).eq("user_id", userId);
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);

  const upcomingAppointments = appointments
    .filter((a) => a.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const pastAppointments = appointments
    .filter((a) => a.date < todayStr)
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    appointments,
    upcomingAppointments,
    pastAppointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
  };
}

export { APPOINTMENT_TYPES };
