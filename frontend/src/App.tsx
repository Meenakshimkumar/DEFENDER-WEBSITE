import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GlobalAlertSound } from "./components/GlobalAlertSound";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import MapView from "./pages/MapView";
import Alerts from "./pages/Alerts";
import Heatmap from "./pages/Heatmap";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import Detection from "./pages/Detection";
import AudioDetection from "./pages/AudioDetection";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <GlobalAlertSound />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/heatmap" element={<Heatmap />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/detect" element={<Detection />} />
          <Route path="/audio-detect" element={<AudioDetection />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
