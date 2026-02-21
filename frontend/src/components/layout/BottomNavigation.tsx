import { Home, BarChart3 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/dashboard", gradient: "gradient-primary" },
  { icon: BarChart3, label: "Analytics", path: "/heatmap", gradient: "gradient-secondary" },
];

export const BottomNavigation = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border w-full mx-auto shadow-lg z-50">
      <div className="flex items-center justify-around py-3 max-w-7xl mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path === "/dashboard" && ["/dashboard", "/map", "/alerts", "/reports"].includes(location.pathname));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all",
                isActive
                  ? "scale-105"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                isActive
                  ? `${item.gradient} shadow-md`
                  : "bg-muted hover:bg-muted/80"
              )}>
                <item.icon className={cn(
                  "w-5 h-5",
                  isActive ? "text-white" : "text-muted-foreground"
                )} />
              </div>
              <span className={cn(
                "text-xs font-semibold",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};