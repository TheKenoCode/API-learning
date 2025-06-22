"use client";

import AuthDebugger from "@/components/AuthDebugger";

interface DashboardClientProps {
  children: React.ReactNode;
}

export default function DashboardClient({ children }: DashboardClientProps) {
  return (
    <div>
      <AuthDebugger />
      {children}
    </div>
  );
} 