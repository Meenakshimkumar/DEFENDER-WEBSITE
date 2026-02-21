import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, PawPrint, Zap, Wifi, TrendingUp, Shield, Focus, Volume2 } from "lucide-react";

const navigationTabs = [
  { label: "Dashboard", path: "/dashboard", gradient: "gradient-primary" },
  { label: "Live Monitor", path: "/map", gradient: "gradient-cool" },
  { label: "Alerts", path: "/alerts", gradient: "gradient-warm" },
  { label: "Heatmaps", path: "/heatmap", gradient: "gradient-secondary" },
  { label: "Reports", path: "/reports", gradient: "gradient-accent" },
];

const summaryStats = [
  {
    label: "Total Intrusions Today",
    value: "12",
    icon: AlertTriangle,
    gradient: "gradient-warm",
    iconColor: "text-accent-foreground"
  },
  {
    label: "Animals Detected",
    value: "45",
    icon: PawPrint,
    gradient: "gradient-secondary",
    iconColor: "text-secondary-foreground"
  },
  {
    label: "Active Deterrents",
    value: "8",
    icon: Zap,
    gradient: "gradient-accent",
    iconColor: "text-accent-foreground"
  },
  {
    label: "System Status",
    value: "Online",
    icon: Wifi,
    gradient: "gradient-primary",
    isStatus: true,
    iconColor: "text-primary-foreground"
  },
];

const Dashboard = () => {
  const navigate = useNavigate();

  const [dynamicStats, setDynamicStats] = useState(summaryStats);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/summary');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        setDynamicStats(prevStats => {
          const newStats = [...prevStats];
          newStats[0] = { ...newStats[0], value: data.total_intrusions.toString() };
          newStats[1] = { ...newStats[1], value: data.animals_detected.toString() };
          newStats[2] = { ...newStats[2], value: data.active_deterrents.toString() };
          newStats[3] = { ...newStats[3], value: data.status };
          return newStats;
        });
      } catch (error) {
        console.error("Error fetching live summary:", error);
      }
    };

    // Initial fetch
    fetchSummary();

    // Poll every 4 seconds
    const interval = setInterval(fetchSummary, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <MobileLayout>
      <PageHeader title="DEFENDER - Monitor" showBack={false} />

      <div className="p-4 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 animate-fade-in">
          {navigationTabs.map((tab, index) => (
            <Button
              key={tab.path}
              variant={tab.path === "/dashboard" ? "default" : "outline"}
              size="sm"
              onClick={() => navigate(tab.path)}
              className={`text-xs font-semibold transition-all hover:scale-105 ${tab.path === "/dashboard"
                ? "gradient-primary text-primary-foreground shadow-md glow-primary"
                : "hover:bg-muted"
                }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Summary Section */}
        <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Summary</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dynamicStats.map((stat, index) => (
              <Card
                key={`${stat.label}-${stat.value}`} // Force re-animation on value change
                className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer animate-in fade-in zoom-in-95 duration-500"
                style={{ animationDelay: `${(index + 2) * 0.1}s` }}
              >
                <CardContent className="p-0">
                  <div className={`${stat.gradient} p-3`}>
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center mb-2">
                      <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                  <div className="p-4 bg-card">
                    <p className="text-xs text-muted-foreground mb-1 font-medium">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.isStatus ? 'text-success' : 'text-foreground'}`}>
                      {stat.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg gradient-secondary flex items-center justify-center">
              <Shield className="w-4 h-4 text-secondary-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Button
              variant="outline"
              className="h-16 flex-col gap-1 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all shadow-sm"
              onClick={() => navigate("/detect")}
            >
              <Focus className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold">AI Detect</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex-col gap-1 border-2 border-secondary/20 hover:border-secondary hover:bg-secondary/5 transition-all shadow-sm"
              onClick={() => navigate("/audio-detect")}
            >
              <Volume2 className="w-5 h-5 text-secondary" />
              <span className="text-xs font-semibold">Audio Listen</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex-col gap-1 border-2 hover:border-primary hover:bg-primary/5 transition-all"
              onClick={() => navigate("/map")}
            >
              <Wifi className="w-5 h-5 text-info" />
              <span className="text-xs font-medium">Live Feed</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex-col gap-1 border-2 hover:border-secondary hover:bg-secondary/5 transition-all"
              onClick={() => navigate("/alerts")}
            >
              <AlertTriangle className="w-5 h-5 text-warning" />
              <span className="text-xs font-medium">View Alerts</span>
            </Button>
          </div>
        </section>
      </div>
    </MobileLayout>
  );
};

export default Dashboard;