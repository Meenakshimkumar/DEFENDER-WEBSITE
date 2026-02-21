import { useState, useEffect } from "react";
import { ChevronLeft, Bell, Shield, Info, AlertTriangle, AlertOctagon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
}

export const PageHeader = ({ title, showBack = true }: PageHeaderProps) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/events');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        // Keep top 5 latest
        setNotifications(data.slice(0, 5));
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const hasHighSeverity = notifications.some(n => n.severity === "high");
  const unreadCount = notifications.length;

  return (
    <header className="relative overflow-visible z-50">
      <div className="absolute inset-0 gradient-primary opacity-95 pointer-events-none" />
      <div className="relative flex items-center gap-3 p-4">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-primary-foreground" />
          </button>
        )}
        {!showBack && (
          <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-accent-foreground" />
          </div>
        )}
        <h1 className="flex-1 text-lg font-bold text-primary-foreground tracking-wide">{title}</h1>

        <Popover>
          <PopoverTrigger asChild>
            <button className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-colors relative outline-none focus:ring-2 focus:ring-white">
              <Bell className="w-5 h-5 text-primary-foreground" />
              {unreadCount > 0 && (
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${hasHighSeverity ? 'bg-destructive animate-pulse' : 'bg-warning'}`} />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 mr-4 mt-2" align="end" sideOffset={5}>
            <div className="bg-muted px-4 py-3 border-b flex justify-between items-center">
              <span className="font-semibold text-sm">Recent Alerts</span>
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{unreadCount} New</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No active alerts.
                </div>
              ) : (
                notifications.map((notif: any) => (
                  <div key={notif.id} className="p-3 border-b border-border hover:bg-muted/50 transition-colors flex gap-3 cursor-pointer" onClick={() => navigate('/alerts')}>
                    <div className="mt-1">
                      {notif.severity === "high" ? (
                        <AlertOctagon className="w-5 h-5 text-destructive" />
                      ) : notif.severity === "medium" ? (
                        <AlertTriangle className="w-5 h-5 text-warning" />
                      ) : (
                        <Info className="w-5 h-5 text-info" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-semibold capitalize">{notif.animal}</p>
                        <span className="text-[10px] text-muted-foreground">{notif.timestamp}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{notif.subtext}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div
              className="p-2 text-center text-xs font-medium text-primary hover:bg-primary/10 cursor-pointer border-t"
              onClick={() => navigate('/alerts')}
            >
              View All Activity
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
};