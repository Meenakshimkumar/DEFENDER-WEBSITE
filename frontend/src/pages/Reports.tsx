import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, Download, Eye, TrendingUp, Settings2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const getTagColor = (tag: string) => {
  switch (tag.toLowerCase()) {
    case "high severity":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "medium severity":
      return "bg-warning/10 text-warning border-warning/30";
    case "low severity":
      return "bg-success/10 text-success border-success/30";
    case "intrusion":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "wildlife":
      return "bg-primary/10 text-primary border-primary/30";
    case "threat":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "observation":
      return "bg-info/10 text-info border-info/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const Reports = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [viewReport, setViewReport] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSimulatingGen, setIsSimulatingGen] = useState(false);

  useEffect(() => {
    const fetchEventsAsReports = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/events');
        if (!response.ok) throw new Error('Network response was not ok');
        const events = await response.json();

        // Convert raw events into "Formal Reports"
        const generatedReports = events.map((event: any) => {
          let gradient = "gradient-primary";
          let icon = "📝";
          let title = `Activity Log - ${event.animal}`;
          let tags = ["Observation", `${event.severity} severity`];

          if (event.severity === "high") {
            gradient = "gradient-warm";
            icon = "🚨";
            title = `Critical Intrusion: ${event.animal}`;
            tags = ["Intrusion", "Threat", `${event.severity} severity`];
          } else if (event.severity === "medium") {
            gradient = "gradient-accent";
            icon = "⚠️";
            title = `Perimeter Alert: ${event.animal}`;
            tags = ["Wildlife", `${event.severity} severity`];
          }

          return {
            id: event.id,
            title: title,
            tags: tags,
            description: `Recorded at ${event.timestamp}. ${event.subtext}.`,
            icon: icon,
            gradient: gradient,
            rawEvent: event // keep local ref for the PDF builder
          };
        });

        // Always ensure we have some base analytical reports at the end
        const baseReports = [
          {
            id: 'weekly-1',
            title: "Weekly Summary Report",
            tags: ["Weekly", "Summary"],
            description: "Comprehensive overview of activities over the past week.",
            icon: "📊",
            gradient: "gradient-secondary",
          },
          {
            id: 'monthly-1',
            title: "Monthly Analysis",
            tags: ["Monthly", "Analysis"],
            icon: "📈",
            gradient: "gradient-cool",
            description: "Detailed analysis of wildlife patterns and trends.",
          }
        ];

        setReports([...generatedReports, ...baseReports]);
      } catch (error) {
        console.error("Error fetching events for reports:", error);
      }
    };

    fetchEventsAsReports();
    const interval = setInterval(fetchEventsAsReports, 8000); // UI poll

    return () => clearInterval(interval);
  }, []);

  const downloadReportPDF = (report: any) => {
    const doc = new jsPDF();
    doc.text(`DEFENDER Incident Report`, 14, 15);
    doc.text(`Title: ${report.title}`, 14, 25);
    doc.text(`Details: ${report.description}`, 14, 35);
    doc.text(`Tags: ${report.tags.join(', ')}`, 14, 45);

    if (report.rawEvent) {
      autoTable(doc, {
        head: [['Property', 'Value']],
        body: [
          ['Animal', report.rawEvent.animal],
          ['Severity', report.rawEvent.severity],
          ['Timestamp', report.rawEvent.timestamp],
          ['Emoji ID', report.rawEvent.emoji]
        ],
        startY: 55
      });
    }

    doc.save(`defender_report_${report.id}.pdf`);
  };

  const handleGenerateClick = () => {
    setIsGenerating(true);
    setIsSimulatingGen(true);
    setTimeout(() => {
      setIsSimulatingGen(false);
    }, 2000); // Simulate network delay
  };

  return (
    <MobileLayout>
      <PageHeader title="DEFENDER - Reports" />

      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center shadow-lg glow-accent">
              <FileText className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Recent Reports</h2>
              <p className="text-sm text-muted-foreground">{reports.length} reports available</p>
            </div>
          </div>
          <Button size="sm" className="gradient-primary text-primary-foreground shadow-md" onClick={handleGenerateClick}>
            <TrendingUp className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>

        {/* Reports List */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report, index) => (
            <Card
              key={report.id}
              className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] animate-in fade-in slide-in-from-top-4 duration-500"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardContent className="p-0">
                <div className="flex">
                  <div className={`${report.gradient} p-4 flex items-center justify-center w-20`}>
                    <span className="text-3xl">{report.icon}</span>
                  </div>
                  <div className="flex-1 p-4 bg-card">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-foreground text-sm line-clamp-1 mr-2">{report.title}</h3>
                      <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                    <div className="flex gap-2 mb-2 flex-wrap">
                      {report.tags.map((tag: string) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className={`text-xs border ${getTagColor(tag)}`}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{report.description}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border hover:bg-primary/5 hover:border-primary"
                        onClick={() => setViewReport(report)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border hover:bg-secondary/5 hover:border-secondary"
                        onClick={() => downloadReportPDF(report)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Generate New Report */}
        <section className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Card
            className="border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer"
            onClick={handleGenerateClick}
          >
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 rounded-xl gradient-primary mx-auto mb-3 flex items-center justify-center shadow-lg">
                <FileText className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Generate New Report</h3>
              <p className="text-sm text-muted-foreground">Create a custom report with selected parameters</p>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* View Report Dialog */}
      <Dialog open={!!viewReport} onOpenChange={(open) => !open && setViewReport(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{viewReport?.icon}</span>
              {viewReport?.title}
            </DialogTitle>
            <DialogDescription>
              Detailed view of the incident and recorded metadata.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-wrap gap-2">
              {viewReport?.tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className={getTagColor(tag)}>{tag}</Badge>
              ))}
            </div>
            <div className="bg-muted p-4 rounded-lg text-sm border border-border">
              <p className="text-foreground">{viewReport?.description}</p>
            </div>

            {viewReport?.rawEvent && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-card p-2 rounded border border-border">
                  <span className="text-muted-foreground block text-xs">Animal</span>
                  <span className="font-medium">{viewReport.rawEvent.animal}</span>
                </div>
                <div className="bg-card p-2 rounded border border-border">
                  <span className="text-muted-foreground block text-xs">Severity</span>
                  <span className="font-medium capitalize">{viewReport.rawEvent.severity}</span>
                </div>
                <div className="bg-card p-2 rounded border border-border">
                  <span className="text-muted-foreground block text-xs">Timestamp</span>
                  <span className="font-medium">{viewReport.rawEvent.timestamp}</span>
                </div>
                <div className="bg-card p-2 rounded border border-border">
                  <span className="text-muted-foreground block text-xs">Confidence</span>
                  <span className="font-medium">{viewReport.rawEvent.subtext.match(/\(([^)]+)\)/)?.[1] || 'N/A'}</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setViewReport(null)}>Close</Button>
            <Button onClick={() => downloadReportPDF(viewReport)}>
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generate Report Dialog */}
      <Dialog open={isGenerating} onOpenChange={setIsGenerating}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Custom Report</DialogTitle>
            <DialogDescription>
              Compile recent AI detections and hardware metrics into a comprehensive PDF summary.
            </DialogDescription>
          </DialogHeader>

          {isSimulatingGen ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm font-medium animate-pulse">Aggregating AI Telemetry...</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="bg-success/10 border border-success/30 text-success p-4 rounded-lg flex items-center gap-3">
                <Settings2 className="w-5 h-5 shrink-0" />
                <p className="text-sm">Summary report covering {reports.length} total events is ready to download.</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsGenerating(false)}>Cancel</Button>
            <Button
              disabled={isSimulatingGen}
              onClick={() => {
                // Trigger a general PDF download covering the top 10 reports
                const doc = new jsPDF();
                doc.text("DEFENDER Executive Summary Report", 14, 15);
                doc.setFontSize(10);
                doc.text(`Total Logged Events: ${reports.length}`, 14, 22);

                const tableData = reports.slice(0, 15).map((r) => [r.title, r.tags.join(', '), r.description]);

                autoTable(doc, {
                  head: [['Event Title', 'Tags', 'Description']],
                  body: tableData,
                  startY: 30
                });

                doc.save(`defender_summary_${Date.now()}.pdf`);
                setIsGenerating(false);
              }}
            >
              {!isSimulatingGen && <Download className="w-4 h-4 mr-2" />}
              {isSimulatingGen ? "Processing..." : "Export Master PDF"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default Reports;