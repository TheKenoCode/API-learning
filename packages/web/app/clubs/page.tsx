"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { 
  Crown, 
  MapPin, 
  Plus, 
  Search,
  Globe,
  Lock,
  ChevronRight,
  UserPlus,
  Clock,
  CheckCircle,
  X,
  ArrowUpRight,
  Sparkles,
  Users,
  Trophy,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export default function ClubsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "public" | "private">("all");
  const [loadingClubIds, setLoadingClubIds] = useState<Set<string>>(new Set());
  const { isSignedIn } = useUser();
  
  // Fetch clubs data using searchClubs with empty query to get all clubs
  const { data: clubsData, isLoading, error, refetch } = api.club.searchClubs.useQuery({
    query: searchQuery || undefined,
    isPrivate: filterType === "public" ? false : filterType === "private" ? true : undefined,
    limit: 50,
  });
  
  const clubs = clubsData?.clubs ?? [];

  // Request to join private club mutation
  const requestToJoinMutation = api.club.requestToJoin.useMutation({
    onSuccess: () => {
      refetch(); // Refresh the clubs list to show updated status
    },
    onError: () => {
      // Error will be handled by tRPC error boundary
    },
  });

  // Join public club mutation
  const joinClubMutation = api.club.join.useMutation({
    onSuccess: () => {
      refetch(); // Refresh the clubs list to show updated status
    },
    onError: () => {
      // Error will be handled by tRPC error boundary
    },
  });

  // Cancel join request mutation
  const cancelJoinRequestMutation = api.club.cancelJoinRequest.useMutation({
    onSuccess: () => {
      refetch(); // Refresh the clubs list to show updated status
    },
    onError: () => {
      // Error will be handled by tRPC error boundary
    },
  });

  const handleJoinRequest = async (clubId: string, isPrivate: boolean, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to club page
    e.stopPropagation();
    
    if (!isSignedIn) return;
    
    // Add this club to loading state
    setLoadingClubIds(prev => new Set(prev).add(clubId));
    
    try {
      if (isPrivate) {
        await requestToJoinMutation.mutateAsync({ clubId });
      } else {
        await joinClubMutation.mutateAsync({ clubId });
      }
    } catch (error) {
      // Error handling is done in the mutation callbacks
    } finally {
      // Remove this club from loading state
      setLoadingClubIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(clubId);
        return newSet;
      });
    }
  };

  const handleCancelRequest = async (clubId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to club page
    e.stopPropagation();
    
    if (!isSignedIn) return;
    
    // Add this club to loading state
    setLoadingClubIds(prev => new Set(prev).add(clubId));
    
    try {
      await cancelJoinRequestMutation.mutateAsync({ clubId });
    } catch (error) {
      // Error handling is done in the mutation callbacks
    } finally {
      // Remove this club from loading state
      setLoadingClubIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(clubId);
        return newSet;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0707] via-[#0f0a0a] to-[#0a0707]">
      {/* Professional Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/30 via-[#0f0a0a] to-[#0a0707]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(127,29,29,0.15),transparent_70%)]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 rounded-full border border-red-500/20 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm font-medium">EXCLUSIVE COMMUNITIES</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight">
                Elite <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">Automotive</span><br />
                Communities
              </h1>
              
              <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                Connect with passionate enthusiasts, compete in exclusive challenges, and build your automotive legacy.
              </p>
            </div>
            
            {/* Streamlined CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Link href="/clubs/create" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto h-14 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold px-8 rounded-xl shadow-xl shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 group"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Club
                  <ArrowUpRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Clean Stats */}
            <div className="flex items-center justify-center gap-8 sm:gap-12 pt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{clubs.length}</div>
                <div className="text-white/50 text-sm">Active Clubs</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">12K+</div>
                <div className="text-white/50 text-sm">Members</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">847</div>
                <div className="text-white/50 text-sm">Active Now</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Search Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search clubs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-[#0f0909]/50 border border-red-950/30 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 focus:bg-[#1a0c0c]/60 transition-all duration-300 text-lg backdrop-blur-sm"
            />
          </div>
          
          {/* Minimal Filter Buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setFilterType("all")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                filterType === "all" 
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-900/50" 
                : "text-white/60 hover:text-white hover:bg-[#1a0c0c]/80 border border-red-950/30"
              }`}
            >
              All
            </button>
            
            <button
              onClick={() => setFilterType("public")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                filterType === "public" 
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-900/50" 
                : "text-white/60 hover:text-white hover:bg-[#1a0c0c]/80 border border-red-950/30"
              }`}
            >
              Public
            </button>
            
            <button
              onClick={() => setFilterType("private")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                filterType === "private" 
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-900/50" 
                : "text-white/60 hover:text-white hover:bg-[#1a0c0c]/80 border border-red-950/30"
              }`}
            >
              Private
            </button>
          </div>
        </div>
      </div>

      {/* Professional Clubs Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white/5 rounded-3xl h-80 border border-white/10" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <div className="text-red-400 text-xl font-semibold mb-2">Failed to load clubs</div>
            <div className="text-white/50">Please check your connection and try again</div>
          </div>
        ) : clubs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-8">
              <Crown className="w-10 h-10 text-red-500/60" />
            </div>
            <div className="text-white text-2xl font-semibold mb-3">No clubs found</div>
            <div className="text-white/50 mb-8">Be the first to create an exclusive community</div>
            <Link href="/clubs/create">
              <Button className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-medium">
                <Plus className="w-4 h-4 mr-2" />
                Create Club
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {clubs.map((club: any) => (
              <div key={club.id} className="group relative">
                <Link href={`/clubs/${club.id}`}>
                  <Card className="relative bg-gradient-to-br from-[#0f0a0a] via-[#1a0f0f] to-[#0d0808] border border-white/5 hover:border-red-500/30 transition-all duration-700 cursor-pointer h-full overflow-hidden backdrop-blur-xl hover:shadow-[0_0_40px_rgba(239,68,68,0.3)] rounded-3xl hover:scale-[1.02] transform-gpu">
                    {/* Premium Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                      <div className="absolute inset-0" style={{
                        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(139,0,0,0.02) 10px, rgba(139,0,0,0.02) 20px),
                                         repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(139,0,0,0.02) 10px, rgba(139,0,0,0.02) 20px)`
                      }} />
                    </div>
                    
                    {/* Animated Gradient Overlay */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-transparent to-red-950/10 animate-pulse" />
                    </div>
                    
                    {/* Top Glow Effect */}
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-red-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                    
                    {/* Club Header */}
                    <CardHeader className="relative p-6 sm:p-8 pb-4 sm:pb-6 z-10">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          {/* Enhanced Avatar with Animation */}
                          <div className="relative group/avatar">
                            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-full blur-xl opacity-0 group-hover/avatar:opacity-50 transition-opacity duration-500" />
                            <Avatar className="relative w-14 h-14 sm:w-16 sm:h-16 ring-2 ring-white/10 group-hover:ring-red-500/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 transform-gpu">
                              <AvatarImage src={club.imageUrl || undefined} alt={club.name} />
                              <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-700 text-white text-lg sm:text-xl font-bold shadow-inner">
                                {club.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          
                          <div className="flex-1 min-w-0 space-y-2">
                            <CardTitle className="text-white text-lg sm:text-xl font-bold group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-red-400 group-hover:to-red-500 group-hover:bg-clip-text transition-all duration-500 leading-tight line-clamp-2 sm:line-clamp-1">
                              {club.name}
                            </CardTitle>
                            
                            {/* Premium Status Badges */}
                            <div className="flex flex-wrap items-center gap-2">
                              {!club.isPrivate ? (
                                <Badge className="bg-green-500/20 text-green-400 border border-green-500/40 text-xs px-3 py-1 font-semibold">
                                  <Globe className="w-3.5 h-3.5 mr-1.5" />
                                  PUBLIC
                                </Badge>
                              ) : (
                                <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/40 text-xs px-3 py-1 font-semibold">
                                  <Lock className="w-3.5 h-3.5 mr-1.5" />
                                  PRIVATE
                                </Badge>
                              )}
                              
                              {/* Enhanced User Status Badges */}
                              {club.userAccess?.isMember && (
                                <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/40 text-xs px-3 py-1 font-semibold">
                                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                  MEMBER
                                </Badge>
                              )}
                              
                              {club.userAccess?.hasJoinRequest && !club.userAccess?.isMember && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 text-xs px-3 py-1 font-semibold">
                                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                                  PENDING
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Animated Arrow */}
                        <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-red-400 group-hover:translate-x-2 transition-all duration-500 flex-shrink-0 mt-1" />
                      </div>
                      
                      {/* Enhanced Description */}
                      <CardDescription className="text-white/50 group-hover:text-white/70 text-sm sm:text-base leading-relaxed line-clamp-3 sm:line-clamp-2 transition-colors duration-300">
                        {club.description || "An exclusive automotive community focused on performance and passion."}
                      </CardDescription>
                    </CardHeader>
                    
                    {/* Premium Stats Section */}
                    <CardContent className="relative px-6 sm:px-8 pb-4 sm:pb-6 z-10">
                      <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        {[
                          { value: club._count?.members || 0, label: "Members", Icon: Users },
                          { value: club._count?.challenges || 0, label: "Challenges", Icon: Trophy },
                          { value: club._count?.events || 0, label: "Events", Icon: Calendar }
                        ].map((stat, idx) => (
                          <div key={idx} className="group/stat relative text-center p-3 sm:p-4 rounded-2xl bg-[#0f0909]/40 hover:bg-[#1a0c0c]/60 border border-red-950/20 hover:border-red-500/20 transition-all duration-300 hover:scale-105 transform-gpu">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-900/5 to-transparent opacity-0 group-hover/stat:opacity-100 rounded-2xl transition-opacity duration-300" />
                            <div className="relative">
                              <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-red-950/20 to-red-900/20 border border-red-900/30 flex items-center justify-center group-hover/stat:from-red-900/30 group-hover/stat:to-red-800/30 group-hover/stat:border-red-500/40 transition-all duration-300">
                                <stat.Icon className="w-5 h-5 text-red-400 group-hover/stat:text-red-300 transition-colors duration-300" />
                              </div>
                              <div className="text-white font-bold text-base sm:text-lg group-hover/stat:text-red-400 transition-colors duration-300 tabular-nums">
                                {stat.value}
                              </div>
                              <div className="text-white/30 text-xs sm:text-sm font-medium">
                                {stat.label}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    
                    {/* Premium Footer */}
                    <CardFooter className="relative px-6 sm:px-8 pb-6 sm:pb-8 pt-0 z-10">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 w-full">
                        {/* Enhanced Location */}
                        {(club.city || club.territory) && (
                          <div className="flex items-center gap-2 text-white/30 group-hover:text-white/50 transition-colors duration-300">
                            <div className="relative">
                              <MapPin className="w-4 h-4" />
                              <div className="absolute inset-0 animate-ping opacity-50">
                                <MapPin className="w-4 h-4" />
                              </div>
                            </div>
                            <span className="text-xs sm:text-sm font-medium truncate max-w-[150px] sm:max-w-[200px]">
                              {[club.city, club.territory].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        )}
                        
                        {/* Premium Join Actions */}
                        {isSignedIn && !club.userAccess?.isMember && !club.userAccess?.isSiteAdmin && (
                          <div onClick={(e) => e.stopPropagation()} className="w-full sm:w-auto">
                            {club.userAccess?.canJoin ? (
                              <Button
                                size="sm"
                                onClick={(e) => handleJoinRequest(club.id, false, e)}
                                disabled={loadingClubIds.has(club.id)}
                                className="relative w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 font-medium px-4 py-2 sm:px-6 transition-all duration-300 group/btn overflow-hidden"
                              >
                                <span className="relative z-10 flex items-center justify-center">
                                  <UserPlus className="w-4 h-4 mr-1.5 group-hover/btn:rotate-12 transition-transform duration-300" />
                                  {loadingClubIds.has(club.id) ? (
                                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  ) : "Join"}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                              </Button>
                            ) : club.userAccess?.canRequestToJoin ? (
                              <Button
                                size="sm"
                                onClick={(e) => handleJoinRequest(club.id, true, e)}
                                disabled={loadingClubIds.has(club.id)}
                                className="relative w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 font-medium px-4 py-2 sm:px-6 transition-all duration-300 group/btn overflow-hidden"
                              >
                                <span className="relative z-10 flex items-center justify-center">
                                  <UserPlus className="w-4 h-4 mr-1.5 group-hover/btn:rotate-12 transition-transform duration-300" />
                                  {loadingClubIds.has(club.id) ? (
                                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  ) : "Request"}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                              </Button>
                            ) : club.userAccess?.hasJoinRequest ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => handleCancelRequest(club.id, e)}
                                disabled={loadingClubIds.has(club.id)}
                                className="relative w-full sm:w-auto border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 hover:from-red-500/20 hover:to-red-600/20 text-yellow-400 hover:text-red-400 rounded-xl font-medium px-4 py-2 sm:px-6 transition-all duration-300 backdrop-blur-xl"
                              >
                                {loadingClubIds.has(club.id) ? (
                                  <span className="inline-block w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                ) : "Cancel"}
                              </Button>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Bottom Spacer */}
      <div className="h-20 sm:h-8" />
    </div>
  );
} 