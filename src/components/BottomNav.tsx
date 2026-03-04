import { Link, useLocation } from "react-router-dom";
import { Home, Clock, BarChart3, Settings, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/history", icon: Clock, label: "History" },
  { to: "/scan", icon: Camera, label: "Scan", special: true },
  { to: "/analytics", icon: BarChart3, label: "Stats" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
        {navItems.map(({ to, icon: Icon, label, special }) => {
          const active = location.pathname === to;
          if (special) {
            return (
              <Link
                key={to}
                to={to}
                className="flex flex-col items-center -mt-5"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="mt-0.5 text-[10px] font-medium text-primary">
                  {label}
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
