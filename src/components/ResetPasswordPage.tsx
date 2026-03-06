import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ResetPasswordPageProps {
  onDone: () => void;
}

export const ResetPasswordPage = ({ onDone }: ResetPasswordPageProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({ title: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Password updated successfully" });
    onDone();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-12 pb-8">
      <h2 className="text-2xl font-bold text-foreground mb-2">Set new password</h2>
      <p className="text-sm text-muted-foreground mb-8">Enter your new password below</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">New password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-border bg-card p-3 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Confirm password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-border bg-card p-3 text-sm"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-14 rounded-2xl text-base font-semibold mt-4"
        >
          {loading ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
};
