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
  const loadAppointments = useCallback(async (userId: string | null) => {
    if (!userId) {
      setAppointmentsState([]);
      return;
    }

    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (!error && data) {
      setAppointmentsState(data.map(rowToAppointment));
    }
  }, []);

  useEffect(() => {
    let active = true;

    const init = async () => {
      const userId = await getUserId();
      if (active) {
        await loadAppointments(userId);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadAppointments(session?.user?.id ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadAppointments]);

  const addAppointment = useCallback(async (appt: Appointment) => {
    const userId = await getUserId();
    if (!userId) return;

    const { data, error } = await supabase.from("appointments").insert({
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
    }).select().single();

    if (!error && data) {
      const saved = rowToAppointment(data);
      setAppointmentsState((prev) => [...prev.filter((item) => item.id !== saved.id), saved]);
    }
  }, []);

  const updateAppointment = useCallback(async (updated: Appointment) => {
    const userId = await getUserId();
    if (!userId) return;

    const { data, error } = await supabase.from("appointments").update({
      date: updated.date,
      time: updated.time,
      provider: updated.provider,
      type: updated.type,
      reason: updated.reason,
      notes: updated.notes,
      lab_results: updated.labResults,
      follow_up_actions: updated.followUpActions,
      next_appointment_date: updated.nextAppointmentDate,
    }).eq("id", updated.id).eq("user_id", userId).select().single();

    if (!error && data) {
      const saved = rowToAppointment(data);
      setAppointmentsState((prev) => prev.map((a) => (a.id === saved.id ? saved : a)));
    }
  }, []);

  const deleteAppointment = useCallback(async (id: string) => {
    const userId = await getUserId();
    if (!userId) return;

    const { error } = await supabase.from("appointments").delete().eq("id", id).eq("user_id", userId);
    if (!error) {
      setAppointmentsState((prev) => prev.filter((a) => a.id !== id));
    }
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
