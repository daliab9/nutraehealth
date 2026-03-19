import { useState, useEffect, useCallback } from "react";

export interface Appointment {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  provider: string;
  type: string; // GP, Specialist, Therapist, etc.
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

function loadAppointments(): Appointment[] {
  try {
    const stored = localStorage.getItem("nuria_appointments");
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export function useAppointmentStore() {
  const [appointments, setAppointmentsState] = useState<Appointment[]>(loadAppointments);

  useEffect(() => {
    localStorage.setItem("nuria_appointments", JSON.stringify(appointments));
  }, [appointments]);

  const addAppointment = useCallback((appt: Appointment) => {
    setAppointmentsState((prev) => [...prev, appt]);
  }, []);

  const updateAppointment = useCallback((updated: Appointment) => {
    setAppointmentsState((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }, []);

  const deleteAppointment = useCallback((id: string) => {
    setAppointmentsState((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const upcomingAppointments = appointments
    .filter((a) => a.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const pastAppointments = appointments
    .filter((a) => a.date < new Date().toISOString().slice(0, 10))
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
