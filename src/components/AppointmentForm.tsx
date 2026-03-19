import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { APPOINTMENT_TYPES, type Appointment } from "@/stores/useAppointmentStore";

interface AppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (appt: Appointment) => void;
  existing?: Appointment | null;
}

export const AppointmentForm = ({ open, onOpenChange, onSave, existing }: AppointmentFormProps) => {
  const [date, setDate] = useState(existing?.date || "");
  const [time, setTime] = useState(existing?.time || "");
  const [provider, setProvider] = useState(existing?.provider || "");
  const [type, setType] = useState(existing?.type || "");
  const [reason, setReason] = useState(existing?.reason || "");
  const [notes, setNotes] = useState(existing?.notes || "");
  const [labResults, setLabResults] = useState(existing?.labResults || "");
  const [followUpActions, setFollowUpActions] = useState(existing?.followUpActions || "");
  const [nextAppointmentDate, setNextAppointmentDate] = useState(existing?.nextAppointmentDate || "");

  const handleSave = () => {
    if (!date || !provider || !reason) return;
    onSave({
      id: existing?.id || Date.now().toString(),
      date,
      time,
      provider,
      type,
      reason,
      notes,
      labResults,
      followUpActions,
      nextAppointmentDate,
      isPast: date < new Date().toISOString().slice(0, 10),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Appointment" : "Add Appointment"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Date *</p>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Time</p>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-xl" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Provider *</p>
            <Input placeholder="Dr. Smith" value={provider} onChange={(e) => setProvider(e.target.value)} className="rounded-xl" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Type</p>
            <div className="flex flex-wrap gap-1.5">
              {APPOINTMENT_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    type === t ? "border-foreground bg-secondary text-secondary-foreground" : "border-border text-muted-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Reason *</p>
            <Input placeholder="Annual check-up" value={reason} onChange={(e) => setReason(e.target.value)} className="rounded-xl" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Notes</p>
            <Textarea placeholder="Notes from the appointment..." value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl min-h-[80px]" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Lab Results Discussed</p>
            <Textarea placeholder="Any lab results..." value={labResults} onChange={(e) => setLabResults(e.target.value)} className="rounded-xl min-h-[60px]" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Follow-up Actions</p>
            <Textarea placeholder="Next steps..." value={followUpActions} onChange={(e) => setFollowUpActions(e.target.value)} className="rounded-xl min-h-[60px]" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Next Appointment Date</p>
            <Input type="date" value={nextAppointmentDate} onChange={(e) => setNextAppointmentDate(e.target.value)} className="rounded-xl" />
          </div>
          <Button onClick={handleSave} className="w-full rounded-xl h-12" disabled={!date || !provider || !reason}>
            {existing ? "Save Changes" : "Add Appointment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
