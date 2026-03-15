import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface LoginPageProps {
  onLogin: () => void;
  onBack: () => void;
  onForgotPassword: () => void;
}

export const LoginPage = ({ onLogin, onBack, onForgotPassword }: LoginPageProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast({ title: error.message, variant: "destructive" });
      return;
    }

    onLogin();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-12 pb-8">
      <button onClick={onBack} className="mb-8 flex items-center text-foreground">
        <ChevronLeft className="h-5 w-5" />
        <span className="text-sm font-medium">Back</span>
      </button>

      <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back</h2>
      <p className="text-sm text-muted-foreground mb-8">Log in to continue tracking</p>

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
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-border bg-card p-3 pr-10 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm text-muted-foreground underline"
        >
          Forgot password?
        </button>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-14 rounded-2xl text-base font-semibold mt-2"
        >
          {loading ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </div>
  );
};
