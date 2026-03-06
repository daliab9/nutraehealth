import nutraeLogo from "@/assets/nutrae-logo.png";
import { Button } from "@/components/ui/button";

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const LandingPage = ({ onGetStarted, onLogin }: LandingPageProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="flex flex-1 flex-col items-center justify-center">
        <img src={nutraeLogo} alt="Nutrae logo" className="w-48 h-48 object-contain mb-6" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground lowercase">nutrae</h1>
        <p className="mt-2 text-sm tracking-[0.2em] uppercase text-muted-foreground">
          Physical & Mental Health Tracker
        </p>
      </div>

      <div className="w-full max-w-xs space-y-3 pb-16">
        <Button
          onClick={onGetStarted}
          className="w-full h-14 rounded-2xl text-base font-semibold"
          style={{ backgroundColor: "#E4E6C4", color: "#1a1a1a" }}
        >
          Get started
        </Button>
        <Button
          onClick={onLogin}
          variant="outline"
          className="w-full h-14 rounded-2xl text-base font-semibold border-2 border-foreground"
        >
          Login
        </Button>
      </div>
    </div>
  );
};
