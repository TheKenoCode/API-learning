"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { cn } from "@/lib/utils"

interface EnhancedAvatarProps {
  user?: {
    id?: string;
    name?: string | null;
    imageUrl?: string | null;
  };
  src?: string | null;
  alt?: string;
  fallbackText?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showOnlineStatus?: boolean;
}

/**
 * Enhanced Avatar component with better fallback logic
 * 
 * Handles user data from enriched sources and provides:
 * - Smart fallback from imageUrl to initials
 * - Proper error handling for broken images
 * - Consistent sizing options
 * - Better accessibility
 */
export function EnhancedAvatar({
  user,
  src,
  alt,
  fallbackText,
  className,
  size = 'md',
  showOnlineStatus = false,
}: EnhancedAvatarProps) {
  // Determine the best image source
  const imageUrl = src || user?.imageUrl;
  
  // Determine the best alt text
  const altText = alt || user?.name || 'User avatar';
  
  // Generate initials from name
  const getInitials = (name: string | null | undefined): string => {
    if (fallbackText) return fallbackText;
    if (!name) return 'U';
    
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0]![0]?.toUpperCase() || 'U';
    }
    
    const first = words[0]![0]?.toUpperCase() || '';
    const last = words[words.length - 1]![0]?.toUpperCase() || '';
    return first + last || 'U';
  };

  // Size classes
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-10 w-10 text-sm', 
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  const initials = getInitials(user?.name);

  return (
    <div className="relative">
      <Avatar className={cn(sizeClasses[size], className)}>
        {imageUrl && (
          <AvatarImage 
            src={imageUrl} 
            alt={altText}
            onError={(e) => {
              // Silently handle image errors by hiding the image
              // This will trigger the fallback to show
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        )}
        <AvatarFallback 
          className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold select-none"
          title={user?.name || altText}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      
      {showOnlineStatus && (
        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
      )}
    </div>
  );
}

/**
 * Avatar component specifically for posts/comments with user data
 */
export function UserAvatar({
  user,
  className,
  size = 'md',
}: {
  user?: {
    id?: string;
    name?: string | null;
    imageUrl?: string | null;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  return (
    <EnhancedAvatar
      user={user}
      className={cn("ring-1 ring-white/10 flex-shrink-0", className)}
      size={size}
    />
  );
} 