import nutraeLogo from "@/assets/nutrae-logo.png";

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const LandingPage = ({ onGetStarted, onLogin }: LandingPageProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="flex flex-1 flex-col items-center justify-center">
        <img src={nutraeLogo} alt="Nutrae logo" className="w-40 h-40 object-contain mb-8" />
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground lowercase">nutrae</h1>
        <p className="mt-4 text-sm tracking-[0.25em] uppercase text-muted-foreground font-medium">
          Physical & Mental Health Tracker
        </p>
      </div>

      <div className="w-full max-w-xs space-y-3 pb-16">
        <button
          onClick={onGetStarted}
          className="w-full h-14 rounded-2xl text-base font-semibold transition-colors duration-200"
          style={{ backgroundColor: "#1a1a1a", color: "#fff" }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#BDAE8D"; e.currentTarget.style.color = "#1a1a1a"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#1a1a1a"; e.currentTarget.style.color = "#fff"; }}
        >
          Get started
        </button>
        <button
          onClick={onLogin}
          className="w-full h-14 rounded-2xl text-base font-semibold transition-colors duration-200"
          style={{ backgroundColor: "#E4E6C4", color: "#1a1a1a" }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#737834"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#E4E6C4"; e.currentTarget.style.color = "#1a1a1a"; }}
        >
          Login
        </button>
      </div>
    </div>
  );
};
