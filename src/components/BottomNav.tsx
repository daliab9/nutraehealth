import { Link, useLocation } from "react-router-dom";
import { BookOpen, BarChart3, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: BookOpen, label: "Diary" },
  { to: "/tracker", icon: BarChart3, label: "Tracker" },
  { to: "/health-diary", icon: Heart, label: "Health" },
  { to: "/profile", icon: User, label: "Profile" },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around px-4 py-2">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-1.5 rounded-2xl transition-all",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
