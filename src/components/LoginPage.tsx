import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface LoginPageProps {
  onLogin: () => void;
  onBack: () => void;
}

export const LoginPage = ({ onLogin, onBack }: LoginPageProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Local-only app: just mark as logged in
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full rounded-xl border border-border bg-card p-3 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-border bg-card p-3 text-sm"
          />
        </div>

        <Button type="submit" className="w-full h-14 rounded-2xl text-base font-semibold mt-4">
          Log in
        </Button>
      </form>
    </div>
  );
};
