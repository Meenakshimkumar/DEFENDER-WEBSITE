import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Phone, Save, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function Settings() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load existing phone number from backend
    fetch("http://127.0.0.1:5000/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data.emergency_contact) {
          setPhoneNumber(data.emergency_contact);
        }
      })
      .catch(err => console.error("Could not load settings:", err));
  }, []);

  const handleSave = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number including country code (e.g. +1234567890).",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emergency_contact: phoneNumber })
      });

      if (res.ok) {
        toast({
          title: "Contact Saved!",
          description: "Emergency SMS alerts will now be sent to this number.",
        });
      } else {
        throw new Error("Failed to save to backend");
      }
    } catch (error) {
      toast({
        title: "Error Saving Contact",
        description: "Could not connect to the DEFENDER backend.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testSms = async () => {
    toast({
      title: "Sending Test Alert...",
      description: "Triggering an API call to verify SMS delivery.",
    });

    try {
      const res = await fetch("http://127.0.0.1:5000/api/test_sms", { method: "POST" });

      if (res.ok) {
        toast({
          title: "Test SMS Sent!",
          description: "Check your phone for the DEFENDER alert message.",
        });
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to send SMS");
      }
    } catch (error: any) {
      toast({
        title: "SMS Failed",
        description: error.message || "Failed to trigger the SMS API. Ensure backend is running.",
        variant: "destructive"
      });
    }
  };

  return (
    <MobileLayout>
      <PageHeader title="System Settings" />

      <div className="p-4 space-y-6">
        <section className="animate-fade-in">
          <Card className="border-2 border-primary/20 shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <ShieldAlert className="w-32 h-32" />
            </div>

            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 text-xl text-primary">
                <Phone className="w-6 h-6" />
                Emergency SMS Alerts
              </CardTitle>
              <CardDescription>
                Configure the farmer contact number that will automatically receive SMS text messages when a high-severity intrusion (Lion, Wolf, Elephant, etc.) is detected.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">Mobile Phone Number (with Country Code)</label>
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1 text-lg py-6"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Format examples: +1 (USA), +91 (India), +44 (UK)</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full sm:w-auto flex-1 h-12 text-md gap-2"
                >
                  {isSaving ? "Saving..." : <><Save className="w-5 h-5" /> Save Contact Number</>}
                </Button>

                <Button
                  onClick={testSms}
                  variant="outline"
                  className="w-full sm:w-auto h-12 text-md gap-2 border-primary/30 hover:bg-primary/10"
                >
                  <ShieldAlert className="w-5 h-5 text-primary" /> Test SMS Delivery
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <Card className="border shadow-sm opacity-60">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" /> System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between py-1 border-b">
                <span>Edge AI Pipeline</span>
                <span className="text-green-500 font-semibold">Active</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Audio Classification Node</span>
                <span className="text-green-500 font-semibold">Active</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Hardware Deterrents (Ultrasonic/Strobe)</span>
                <span className="text-green-500 font-semibold">Ready</span>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </MobileLayout>
  );
}