import { PageHeader } from "@/components/layout/PageHeader";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Key, User, Bell, Wrench, ChevronRight, Shield, Moon, Globe } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const accountSettings = [
  {
    icon: Key,
    label: "Change Password",
    description: "Update your account password",
    gradient: "gradient-primary",
  },
  {
    icon: User,
    label: "Contact Info",
    description: "Manage your contact details",
    gradient: "gradient-secondary",
  },
  {
    icon: Shield,
    label: "Security",
    description: "Two-factor authentication",
    gradient: "gradient-accent",
  },
];

const systemSettings = [
  {
    icon: Bell,
    label: "Notifications",
    description: "Configure alert preferences",
    gradient: "gradient-warm",
    hasToggle: true,
  },
  {
    icon: Moon,
    label: "Dark Mode",
    description: "Toggle dark theme",
    gradient: "gradient-cool",
    hasToggle: true,
  },
  {
    icon: Globe,
    label: "Language",
    description: "English (US)",
    gradient: "gradient-secondary",
  },
  {
    icon: Wrench,
    label: "System Preferences",
    description: "Advanced configuration",
    gradient: "gradient-primary",
  },
];

const Settings = () => {
  return (
    <MobileLayout>
      <PageHeader title="DEFENDER - Settings" />
      
      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border shadow-lg animate-fade-in">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg glow-primary">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">John Ranger</h2>
            <p className="text-sm text-muted-foreground">Wildlife Protection Officer</p>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-xs text-success font-medium">Active</span>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Account Settings
          </h2>
          <div className="space-y-3">
            {accountSettings.map((item, index) => (
              <Card 
                key={index} 
                className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all hover:scale-[1.01] cursor-pointer"
              >
                <CardContent className="p-0">
                  <div className="flex items-center">
                    <div className={`${item.gradient} p-4 flex items-center justify-center`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 p-4 flex items-center justify-between bg-card">
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">{item.label}</h3>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* System Settings */}
        <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-secondary" />
            System Settings
          </h2>
          <div className="space-y-3">
            {systemSettings.map((item, index) => (
              <Card 
                key={index} 
                className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <CardContent className="p-0">
                  <div className="flex items-center">
                    <div className={`${item.gradient} p-4 flex items-center justify-center`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 p-4 flex items-center justify-between bg-card">
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">{item.label}</h3>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      {item.hasToggle ? (
                        <Switch />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* App Version */}
        <div className="text-center pt-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <p className="text-xs text-muted-foreground">DEFENDER v2.0.1</p>
          <p className="text-xs text-muted-foreground mt-1">© 2024 Wildlife Protection Systems</p>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Settings;