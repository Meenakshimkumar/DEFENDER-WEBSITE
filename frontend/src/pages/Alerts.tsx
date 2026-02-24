import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download, Filter, Clock, FileText, Zap } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const alertsData = [
  {
    id: 1,
    animal: "Elephant Detected",
    subtext: "Large mammal near perimeter",
    timestamp: "10:00 AM",
    severity: "high",
    emoji: "🐘",
  },
  {
    id: 2,
    animal: "Wild Boar",
    subtext: "Moving towards farm area",
    timestamp: "10:30 AM",
    severity: "medium",
    emoji: "🐗",
  },
  {
    id: 3,
    animal: "Deer Spotted",
    subtext: "Grazing near sensor 3",
    timestamp: "11:15 AM",
    severity: "low",
    emoji: "🦌",
  },
];

const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case "high":
      return { bg: "gradient-warm", border: "border-destructive/30", badge: "bg-destructive" };
    case "medium":
      return { bg: "gradient-accent", border: "border-warning/30", badge: "bg-warning" };
    default:
      return { bg: "gradient-primary", border: "border-success/30", badge: "bg-success" };
  }
};

const Alerts = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/events');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setAlerts(data);
      } catch (error) {
        console.error("Error fetching live events:", error);
      }
    };

    // Initial fetch
    fetchEvents();

    // Poll every 4 seconds
    const interval = setInterval(fetchEvents, 4000);

    return () => clearInterval(interval);
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    if (filterType !== "all" && alert.animal !== filterType) return false;
    if (filterSeverity !== "all" && alert.severity !== filterSeverity) return false;
    return true;
  });

  const exportCSV = () => {
    if (filteredAlerts.length === 0) return;
    const headers = ["Animal,Timestamp,Severity,Details"];
    const rows = filteredAlerts.map(a => `${a.animal},${a.timestamp},${a.severity},"${a.subtext}"`);
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "defender_alerts.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    if (filteredAlerts.length === 0) return;
    const doc = new jsPDF();
    doc.text("DEFENDER Alert Report", 14, 15);
    autoTable(doc, {
      head: [['Animal', 'Time', 'Severity', 'Details']],
      body: filteredAlerts.map(a => [a.animal, a.timestamp, a.severity, a.subtext]),
      startY: 20
    });
    doc.save("defender_alerts.pdf");
  };

  const uniqueAnimals = Array.from(new Set(alerts.map(a => a.animal)));

  return (
    <MobileLayout>
      <PageHeader title="DEFENDER - Alerts" />

      <div className="p-4 space-y-6">
        {/* Header with icon */}
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="w-12 h-12 rounded-xl gradient-warm flex items-center justify-center shadow-lg">
            <AlertTriangle className="w-6 h-6 text-accent-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Alerts & Notifications</h2>
            <p className="text-sm text-muted-foreground">{alerts.length} new alerts today</p>
          </div>
        </div>

        {/* Alerts List */}
        <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {filteredAlerts.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No alerts found for current filters.</p>
            ) : (
              filteredAlerts.map((alert, index) => {
                const styles = getSeverityStyles(alert.severity);
                return (
                  <Card
                    key={alert.id}
                    className={`overflow-hidden border-2 ${styles.border} shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] cursor-pointer animate-in fade-in slide-in-from-top-4 duration-500`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <CardContent className="p-0">
                      <div className="flex">
                        <div className={`${styles.bg} p-4 flex items-center justify-center`}>
                          <span className="text-3xl">{alert.emoji}</span>
                        </div>
                        <div className="flex-1 p-4 bg-card">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold text-foreground">{alert.animal}</p>
                                <div className={`w-2 h-2 rounded-full ${styles.badge}`} />
                              </div>
                              <p className="text-xs text-muted-foreground">{alert.subtext}</p>
                              {alert.deterrent && alert.deterrent !== 'None' && (
                                <p className="text-xs font-semibold text-primary mt-1 flex items-center gap-1">
                                  <Zap className="w-3 h-3" /> Deterrent: {alert.deterrent}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <p className="text-xs">{alert.timestamp}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </section>

        {/* Filter Section */}
        <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-secondary" />
            <h2 className="text-lg font-bold text-foreground">Filter Alerts</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 h-10 px-3 rounded-md border-2 border-input bg-background font-medium text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="all">All Animals</option>
              {uniqueAnimals.map(animal => (
                <option key={animal as string} value={animal as string}>{animal as string}</option>
              ))}
            </select>

            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="flex-1 h-10 px-3 rounded-md border-2 border-input bg-background font-medium text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="all">All Severities</option>
              <option value="low">Low Severity</option>
              <option value="medium">Medium Severity</option>
              <option value="high">High Severity</option>
            </select>
          </div>
        </section>

        {/* Export Section */}
        <section className="flex gap-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Button
            variant="outline"
            onClick={exportCSV}
            className="flex-1 border-2 hover:border-accent hover:bg-accent/5 transition-all font-semibold"
          >
            <FileText className="w-4 h-4 mr-2 text-accent" />
            Export CSV
          </Button>
          <Button
            onClick={exportPDF}
            className="flex-1 gradient-primary text-primary-foreground font-semibold shadow-lg hover:opacity-90 transition-all font-semibold"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </section>
      </div>
    </MobileLayout>
  );
};

export default Alerts;