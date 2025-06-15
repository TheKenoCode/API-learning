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

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
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
                MIDNIGHT CLUB
              </div>
              <div className="text-xs text-white/50 tracking-widest font-medium">
                I R L
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
                <SignInButton mode="modal">
                  <button className="hidden sm:inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/5 whitespace-nowrap">
                    SIGN IN
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
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
          className={`lg:hidden transition-all duration-300 ease-in-out ${
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
