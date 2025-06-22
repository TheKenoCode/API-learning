"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Trophy, 
  MessageCircle, 
  User,
  Crown,
  Bell
} from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";

const MobileNavigation = () => {
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-hide navigation on scroll down, show on scroll up
  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') { 
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar);
      return () => {
        window.removeEventListener('scroll', controlNavbar);
      };
    }
  }, [lastScrollY]);

  const navItems = [
    {
      href: "/",
      icon: Home,
      label: "Home",
      isActive: pathname === "/"
    },
    {
      href: "/clubs",
      icon: Crown,
      label: "Clubs",
      isActive: pathname.startsWith("/clubs")
    },
    {
      href: "/challenges",
      icon: Trophy,
      label: "Challenges",
      isActive: pathname.startsWith("/challenges")
    },
    {
      href: "/social",
      icon: MessageCircle,
      label: "Social",
      isActive: pathname.startsWith("/social")
    },
    {
      href: "/profile",
      icon: User,
      label: "Profile",
      isActive: pathname.startsWith("/profile")
    }
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className={`
        md:hidden fixed bottom-0 left-0 right-0 z-50 
        bg-black/95 backdrop-blur-xl border-t border-white/10
        transition-transform duration-300 ease-in-out
        ${isVisible ? 'translate-y-0' : 'translate-y-full'}
      `}>
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center space-y-1 
                  transition-all duration-200 active:scale-95
                  ${item.isActive 
                    ? 'text-red-500' 
                    : 'text-white/60 hover:text-white'
                  }
                `}
              >
                <div className={`
                  p-1.5 rounded-lg transition-all duration-200
                  ${item.isActive 
                    ? 'bg-red-500/20 shadow-lg shadow-red-500/25' 
                    : 'hover:bg-white/10'
                  }
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
        
        {/* Safe area for devices with home indicator */}
        <div className="h-safe bg-black/95" />
      </nav>

      {/* Mobile Top Status Bar - Enterprise Level */}
      <div className="md:hidden sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Brand Section */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/25">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <div className="text-lg font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              RedLine
            </div>
          </div>
          
          {/* Actions Section */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button className="relative w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 active:scale-95">
              <Bell className="w-5 h-5 text-white" />
              {/* Notification Badge */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            </button>

            {/* User Profile */}
            {isSignedIn ? (
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-red-500/30 hover:border-red-500/60 transition-colors">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-full h-full",
                      userButtonPopoverCard: "bg-black border border-white/20 shadow-2xl",
                      userButtonPopoverActions: "text-white",
                      userButtonPopoverActionButton: "text-white/70 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200",
                      userButtonPopoverFooter: "hidden",
                    },
                  }}
                />
              </div>
            ) : (
              <Link href="/sign-in">
                <button className="w-10 h-10 rounded-full bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition-all duration-200 active:scale-95 border border-red-500/30">
                  <User className="w-5 h-5 text-red-400" />
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Optional: Status Bar for Live Activity */}
        <div className="px-4 pb-2">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 text-xs font-semibold">
                2,847 ONLINE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="md:hidden " />
    </>
  );
};

export default MobileNavigation; 