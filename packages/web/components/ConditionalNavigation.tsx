"use client";

import { usePathname } from "next/navigation";
import Navigation from "@/components/Navigation";
import MobileNavigation from "@/components/MobileNavigation";

function isAuthPage(pathname: string): boolean {
  return pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');
}

export default function ConditionalNavigation() {
  const pathname = usePathname();
  const isAuthPageRoute = isAuthPage(pathname);

  if (isAuthPageRoute) {
    return null;
  }

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <Navigation />
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation />

      {/* Spacer for fixed navigation */}
      <div className="md:h-20" />
    </>
  );
} 