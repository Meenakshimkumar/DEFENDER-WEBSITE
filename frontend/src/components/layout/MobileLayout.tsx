import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";

interface MobileLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export const MobileLayout = ({ children, showNav = true }: MobileLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen bg-background w-full relative">
      <main className="flex-1 pb-20 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
      {showNav && <BottomNavigation />}
    </div>
  );
};
