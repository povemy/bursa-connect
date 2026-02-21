import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: "dashboard", label: "Dash", path: "/" },
  { icon: "hub", label: "Network", path: "/network" },
  { icon: "query_stats", label: "Analysis", path: "/analysis", featured: true },
  { icon: "notifications", label: "Alerts", path: "/alerts" },
  { icon: "shield", label: "Vault", path: "/vault" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-glass-border px-4 pb-6 pt-3 flex justify-between items-center">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        
        if (item.featured) {
          return (
            <Link key={item.path} to={item.path} className="relative -top-6">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-4 border-background transition-all",
                isActive ? "bg-primary shadow-primary/40" : "bg-secondary hover:bg-primary/80"
              )}>
                <span className="material-symbols-outlined font-bold text-primary-foreground">{item.icon}</span>
              </div>
            </Link>
          );
        }

        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
