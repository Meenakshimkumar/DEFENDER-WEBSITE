import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Activity, TrendingUp, MapPin } from "lucide-react";

// Pre-defined color palette for dynamic animal assignment
const CHART_COLORS = [
  "hsl(152, 65%, 35%)",
  "hsl(265, 60%, 55%)",
  "hsl(35, 95%, 55%)",
  "hsl(200, 85%, 50%)",
  "hsl(330, 75%, 55%)",
  "hsl(20, 85%, 50%)",
  "hsl(180, 70%, 40%)",
  "hsl(300, 65%, 50%)"
];

const initialActivityStats = [
  { label: "Peak Activity", value: "None", icon: TrendingUp, color: "text-primary" },
  { label: "Total Detections", value: "0", icon: Activity, color: "text-secondary" },
  { label: "Active Zones", value: "4/6", icon: MapPin, color: "text-accent" },
];

const Heatmap = () => {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState(initialActivityStats);
  const [total, setTotal] = useState(0);
  const [gridIntensities, setGridIntensities] = useState(Array(16).fill(0));

  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/events');
        if (!response.ok) throw new Error('Network response was not ok');
        const events = await response.json();

        // Aggregate events by animal and zone
        const zoneNames = ["Zone A", "Zone B", "Zone C", "Zone D"];
        const groupCounts: Record<string, { animal: string, zone: string, severity: string, count: number }> = {};

        events.forEach((event: any) => {
          const animal = event.animal || "Unknown";
          const zone = zoneNames[event.id % 4] || "Zone A";
          const severity = event.severity || "low"; // Default to low if not present
          const key = `${animal}-${zone}-${severity}`; // Include severity in key

          if (!groupCounts[key]) {
            groupCounts[key] = { animal, zone, severity, count: 0 };
          }
          groupCounts[key].count += 1;
        });

        const newTotal = events.length;
        setTotal(newTotal);

        // Convert aggregated counts to array format for Recharts pie chart
        const newData = Object.values(groupCounts)
          .sort((a, b) => b.count - a.count) // Sort largest to smallest
          .map((item, index) => {
            // Determine color based on severity
            let color = "hsl(152, 65%, 35%)"; // default low
            if (item.severity === "high") {
              const highColors = ["hsl(0, 85%, 50%)", "hsl(340, 85%, 50%)", "hsl(350, 75%, 45%)"];
              color = highColors[index % highColors.length];
            } else if (item.severity === "medium") {
              const medColors = ["hsl(35, 95%, 55%)", "hsl(45, 95%, 50%)", "hsl(25, 90%, 55%)"];
              color = medColors[index % medColors.length];
            } else { // low or unknown
              const lowColors = ["hsl(152, 65%, 35%)", "hsl(120, 60%, 40%)", "hsl(170, 70%, 35%)"];
              color = lowColors[index % lowColors.length];
            }

            return {
              name: `${item.zone} - ${item.animal} (${item.severity})`, // Name for legend/general display
              animal: item.animal,
              zone: item.zone,
              severity: item.severity,
              value: item.count,
              color: color
            };
          });

        setData(newData);

        // Update stats
        setStats(prev => {
          const next = [...prev];
          next[1].value = newTotal.toString();

          if (newData.length > 0) {
            next[0].value = newData[0].name; // Top combination
          } else {
            next[0].value = "None";
          }
          return next;
        });

        // Make the grid intensities pulse slightly proportional to the total events
        const baseIntensity = Math.min(1, newTotal / 50); // cap at 50 events for max glow
        setGridIntensities(Array(16).fill(0).map(() => Math.max(0, Math.min(1, baseIntensity + (Math.random() - 0.5) * 0.3))));

      } catch (error) {
        console.error("Error fetching live heatmap events:", error);
      }
    };

    fetchHeatmapData();
    const interval = setInterval(fetchHeatmapData, 4000);

    return () => clearInterval(interval);
  }, []);

  // Custom Tooltip component for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 border border-border p-3 rounded-lg shadow-xl backdrop-blur-sm">
          <p className="font-bold text-foreground text-sm flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ backgroundColor: data.color }}
            />
            {data.animal}
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            Zone: <span className="text-foreground font-semibold">{data.zone}</span>
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            Severity: <span className={`font-semibold capitalize ${data.severity === 'high' ? 'text-destructive' : data.severity === 'medium' ? 'text-warning' : 'text-success'}`}>{data.severity}</span>
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            Count: <span className="text-foreground font-semibold">{data.value} detections</span>
          </p>
          <p className="text-muted-foreground text-xs mt-1 mb-1">
            Volume: <span className="text-foreground font-semibold">{total > 0 ? Math.round((data.value / total) * 100) : 0}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <MobileLayout>
      <PageHeader title="DEFENDER - Heatmap" />

      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="w-12 h-12 rounded-xl gradient-secondary flex items-center justify-center shadow-lg glow-secondary">
            <Activity className="w-6 h-6 text-secondary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Animal Detection Heatmap</h2>
            <p className="text-sm text-muted-foreground">Real-time volume distribution</p>
          </div>
        </div>

        {/* Activity Stats */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-3 border border-border shadow-sm text-center transition-all duration-500"
            >
              <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
              <p className="text-lg font-bold text-foreground animate-in fade-in slide-in-from-bottom-1" key={stat.value}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Pie Chart */}
        <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="bg-card rounded-2xl p-4 border border-border shadow-lg">
            <div className="h-[280px] relative">
              {data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={3}
                      stroke="hsl(var(--background))"
                      isAnimationActive={true}
                      animationDuration={1500}
                    >
                      {data.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          style={{
                            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <p className="text-muted-foreground text-sm">No detection data available yet.</p>
                </div>
              )}

              {/* Center label */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center transition-all duration-500 pointer-events-none">
                <p className="text-3xl font-bold text-foreground animate-in fade-in" key={total}>{total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
              {data.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <div
                    className="w-4 h-4 rounded-full shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground truncate block">{item.name}</span>
                    <p className="text-xs text-muted-foreground">{total > 0 ? Math.round((item.value / total) * 100) : 0}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Heatmap Grid Visualization */}
        <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-lg font-bold text-foreground mb-3">Zone Activity Grid</h3>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {gridIntensities.map((intensity, i) => {
              const colors = [
                'bg-primary/20', 'bg-primary/40', 'bg-primary/60', 'bg-primary/80',
                'bg-secondary/30', 'bg-secondary/50', 'bg-accent/40', 'bg-accent/60'
              ];
              // Pick color based on intensity
              const colorIndex = Math.floor(intensity * (colors.length - 1));
              return (
                <div
                  key={i}
                  className={`h-12 rounded-lg ${colors[colorIndex]} transition-all duration-1000 ease-in-out hover:scale-105 cursor-pointer`}
                  style={{ opacity: 0.5 + intensity * 0.5 }}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-3 text-xs text-muted-foreground">
            <span>Low Activity</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 rounded bg-primary/20" />
              <div className="w-4 h-4 rounded bg-primary/40" />
              <div className="w-4 h-4 rounded bg-primary/60" />
              <div className="w-4 h-4 rounded bg-primary/80" />
            </div>
            <span>High Activity</span>
          </div>
        </section>
      </div>
    </MobileLayout>
  );
};

export default Heatmap;