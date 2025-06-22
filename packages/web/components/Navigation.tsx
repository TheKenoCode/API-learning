"use client";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import {
  Crown,
  Trophy,
  Target,
  MapPin,
  Package,
  Calendar,
  Menu,
  X,
} from "lucide-react";
import BrandIcon from "@/components/marketing/BrandIcon";
import Link from "next/link";
import { useState } from "react";
import { dark } from "@clerk/themes";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Shared appearance configuration for consistent styling
  const clerkModalAppearance = {
    baseTheme: dark,
    elements: {
      rootBox: "w-full",
      modalContent: "!bg-black/95 !backdrop-blur-2xl",
      modalCloseButton: "!text-white/60 hover:!text-white",
      card: "!bg-white/[0.02] !backdrop-blur-xl !border !border-white/10 !rounded-2xl !p-6 sm:!p-8 !shadow-2xl !shadow-black/50",
      headerTitle: "!text-white !text-2xl !font-bold",
      headerSubtitle: "!text-white/60",
      socialButtonsBlockButton: 
        "!bg-white/5 !border !border-white/10 hover:!bg-white/10 hover:!border-white/20 " +
        "!text-white !transition-all !duration-200 !h-11 sm:!h-12 !text-sm sm:!text-base " +
        "!font-medium !rounded-lg",
      socialButtonsBlockButtonText: "!font-medium",
      socialButtonsProviderIcon: "!w-5 !h-5",
      formFieldLabel: "!text-white/80 !text-sm !font-medium !mb-2 !block",
      formFieldInput: 
        "!bg-white/5 !border !border-white/10 !text-white placeholder:!text-white/30 " +
        "focus:!bg-white/10 focus:!border-red-500/50 focus:!ring-2 focus:!ring-red-500/20 " +
        "!rounded-lg !h-11 sm:!h-12 !px-4 !text-sm sm:!text-base !transition-all !duration-200 " +
        "!w-full",
      formFieldInputShowPasswordButton: "!text-white/40 hover:!text-white/60",
      formButtonPrimary: 
        "!bg-gradient-to-r !from-red-500 !to-red-600 hover:!from-red-600 hover:!to-red-700 " +
        "!text-white !font-semibold !h-11 sm:!h-12 !px-6 !rounded-lg !transition-all !duration-200 " +
        "!shadow-lg !shadow-red-500/25 hover:!shadow-red-500/30 hover:!scale-[1.02] " +
        "!text-sm sm:!text-base !w-full",
      footerActionLink: "!text-red-400 hover:!text-red-300 !font-medium !transition-colors !duration-200",
      footer: "!bg-transparent !mt-6",
      identityPreviewText: "!text-white/80",
      identityPreviewEditButtonIcon: "!text-red-400",
      formFieldAction: "!text-red-400 hover:!text-red-300 !text-sm",
      formFieldError: "!text-red-400 !text-sm !mt-1.5",
      dividerLine: "!bg-white/10",
      dividerText: "!text-white/40 !text-sm !font-normal !bg-transparent !px-4",
      otpCodeFieldInput: 
        "!bg-white/5 !border-white/10 !text-white !text-center !font-mono " +
        "focus:!bg-white/10 focus:!border-red-500/50",
      formResendCodeLink: "!text-red-400 hover:!text-red-300",
      // Form spacing
      form: "!space-y-5",
      formFieldRow: "!space-y-2",
      socialButtonsBlock: "!space-y-3",
      // Alternative methods
      alternativeMethods: "!mt-4",
      alternativeMethodsBlockButton: "!text-white/60 hover:!text-white/80 !text-sm",
      // Loading state
      formButtonPrimarySpinner: "!text-white",
      // Error messages
      formFieldErrorText: "!text-red-400 !text-sm !mt-1.5",
      // Back button in alternative views
      backLink: "!text-white/60 hover:!text-white/80",
      backLinkIcon: "!text-white/60",
      // Additional modal-specific elements
      modalBackdrop: "!bg-black/80 !backdrop-blur-sm",
    },
    layout: {
      socialButtonsPlacement: "top",
      socialButtonsVariant: "blockButton",
      showOptionalFields: false,
    },
    variables: {
      colorPrimary: "#ef4444",
      colorText: "#ffffff",
      colorTextSecondary: "rgba(255, 255, 255, 0.6)",
      colorBackground: "rgba(0, 0, 0, 0.5)",
      colorInputBackground: "rgba(255, 255, 255, 0.05)",
      colorInputText: "#ffffff",
      borderRadius: "0.75rem",
      spacingUnit: "1rem",
      fontSize: "16px",
    },
  };

  return (
    <header className="fixed top-0 w-full z-50 border-b border-red-500/20 bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-black/60">
      <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 via-transparent to-red-900/10" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <Link
            href="/"
            className="flex items-center gap-3 group flex-shrink-0 min-w-0"
            onClick={closeMobileMenu}
          >
            <div className="relative">
              <div className="absolute -inset-2 bg-red-500/20 rounded-full blur-lg group-hover:bg-red-500/30 transition-all duration-300" />
              <BrandIcon className="relative w-10 h-10 text-red-500" />
            </div>
            <div className="hidden sm:block min-w-0">
              <div className="text-xl font-bold text-white group-hover:text-red-500 transition-colors">
                REDLINE
              </div>
              <div className="text-xs text-white/50 tracking-widest font-medium">
                P L A T F O R M
              </div>
            </div>
          </Link>

          {/* Center Navigation Menu */}
          <nav className="hidden lg:flex items-center justify-center flex-1 max-w-2xl mx-8">
            <div className="flex items-center gap-1">
              <Link
                href="/clubs"
                className="flex items-center gap-2 text-white/70 hover:text-red-500 transition-all duration-200 font-medium px-3 py-2 rounded-lg hover:bg-red-500/10 whitespace-nowrap"
              >
                <Crown className="w-4 h-4" />
                <span>Clubs</span>
              </Link>
              <Link
                href="/leaderboards"
                className="flex items-center gap-2 text-white/70 hover:text-red-500 transition-all duration-200 font-medium px-3 py-2 rounded-lg hover:bg-red-500/10 whitespace-nowrap"
              >
                <Trophy className="w-4 h-4" />
                <span>Rankings</span>
              </Link>
              <Link
                href="/challenges"
                className="flex items-center gap-2 text-white/70 hover:text-red-500 transition-all duration-200 font-medium px-3 py-2 rounded-lg hover:bg-red-500/10 whitespace-nowrap"
              >
                <Target className="w-4 h-4" />
                <span>Challenges</span>
              </Link>
              <Link
                href="/territory"
                className="flex items-center gap-2 text-white/70 hover:text-red-500 transition-all duration-200 font-medium px-3 py-2 rounded-lg hover:bg-red-500/10 whitespace-nowrap"
              >
                <MapPin className="w-4 h-4" />
                <span>Territory</span>
              </Link>
              <Link
                href="/marketplace"
                className="flex items-center gap-2 text-white/70 hover:text-red-500 transition-all duration-200 font-medium px-3 py-2 rounded-lg hover:bg-red-500/10 whitespace-nowrap"
              >
                <Package className="w-4 h-4" />
                <span>Market</span>
              </Link>
              <Link
                href="/events"
                className="flex items-center gap-2 text-white/70 hover:text-red-500 transition-all duration-200 font-medium px-3 py-2 rounded-lg hover:bg-red-500/10 whitespace-nowrap"
              >
                <Calendar className="w-4 h-4" />
                <span>Events</span>
              </Link>
            </div>
          </nav>

          {/* Right Section - Live Status & Auth */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Live Status - Simplified responsive logic */}
            <div className="hidden xl:flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 text-xs font-bold whitespace-nowrap">
                  2,847 ONLINE
                </span>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="hidden xl:block h-6 w-px bg-red-500/20"></div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <SignedOut>
                <SignInButton 
                  mode="modal"
                  appearance={clerkModalAppearance}
                  redirectUrl="/dashboard"
                >
                  <button className="hidden sm:inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/5 whitespace-nowrap">
                    SIGN IN
                  </button>
                </SignInButton>
                <SignUpButton 
                  mode="modal"
                  appearance={clerkModalAppearance}
                  redirectUrl="/dashboard"
                >
                  <button className="inline-flex items-center justify-center px-4 py-2 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-300 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 whitespace-nowrap">
                    <span className="hidden lg:inline">
                      JOIN THE REVOLUTION
                    </span>
                    <span className="lg:hidden">JOIN</span>
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox:
                        "w-10 h-10 border-2 border-red-500/30 hover:border-red-500/60 transition-colors",
                      userButtonPopoverCard:
                        "bg-black border border-red-500/20",
                      userButtonPopoverActions: "text-white",
                      userButtonPopoverActionButton:
                        "text-white/70 hover:text-red-500 hover:bg-red-500/10",
                    },
                  }}
                />
              </SignedIn>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 text-white/70 hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10 ml-2"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`lg:hidden z-50 transition-all duration-300 ease-in-out ${
            isMobileMenuOpen
              ? "max-h-96 opacity-100 border-t border-red-500/20 mt-6 pt-6"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/clubs"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-colors"
            >
              <Crown className="w-5 h-5 text-red-500" />
              <span className="font-medium">Clubs</span>
            </Link>
            <Link
              href="/leaderboards"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-colors"
            >
              <Trophy className="w-5 h-5 text-red-500" />
              <span className="font-medium">Rankings</span>
            </Link>
            <Link
              href="/challenges"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-colors"
            >
              <Target className="w-5 h-5 text-red-500" />
              <span className="font-medium">Challenges</span>
            </Link>
            <Link
              href="/territory"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-colors"
            >
              <MapPin className="w-5 h-5 text-red-500" />
              <span className="font-medium">Territory</span>
            </Link>
            <Link
              href="/marketplace"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-colors"
            >
              <Package className="w-5 h-5 text-red-500" />
              <span className="font-medium">Market</span>
            </Link>
            <Link
              href="/events"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-colors"
            >
              <Calendar className="w-5 h-5 text-red-500" />
              <span className="font-medium">Events</span>
            </Link>
          </div>

          {/* Mobile Live Status */}
          <div className="xl:hidden flex items-center justify-center gap-4 mt-6 pt-6 border-t border-red-500/20">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-lg border border-red-500/20">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 text-xs font-bold">
                2,847 ONLINE
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
