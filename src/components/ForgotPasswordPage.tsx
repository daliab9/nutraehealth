import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ForgotPasswordPageProps {
  onBack: () => void;
}

export const ForgotPasswordPage = ({ onBack }: ForgotPasswordPageProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      toast({ title: error.message, variant: "destructive" });
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex min-h-screen flex-col bg-background px-6 pt-12 pb-8">
        <button onClick={onBack} className="mb-8 flex items-center text-foreground">
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h2 className="text-2xl font-bold text-foreground mb-2">Check your email</h2>
        <p className="text-sm text-muted-foreground">
          We sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the link to reset your password.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-12 pb-8">
      <button onClick={onBack} className="mb-8 flex items-center text-foreground">
        <ChevronLeft className="h-5 w-5" />
        <span className="text-sm font-medium">Back</span>
      </button>

      <h2 className="text-2xl font-bold text-foreground mb-2">Reset password</h2>
      <p className="text-sm text-muted-foreground mb-8">
        Enter your email and we'll send you a reset link
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full rounded-xl border border-border bg-card p-3 text-sm"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-14 rounded-2xl text-base font-semibold mt-4"
        >
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </div>
  );
};
