"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, Users, MapPin, Plus, Settings, Shield, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data - replace with actual tRPC queries once implemented
const mockClubs = [
  {
    id: "1",
    name: "MIDNIGHT RUNNERS",
    description: "Elite street crew dominating the downtown scene",
    memberCount: 247,
    location: "Downtown St. Louis",
    leader: "BLACKOUT_STI",
    territory: "Financial District",
    reputation: 8547,
    isVerified: true,
  },
  {
    id: "2", 
    name: "TOKYO DRIFT STL",
    description: "Import tuner specialists with Japanese heritage",
    memberCount: 189,
    location: "West End St. Louis",
    leader: "REDLINE_R34",
    territory: "Industrial Zone",
    reputation: 7823,
    isVerified: true,
  },
  {
    id: "3",
    name: "TURBO MAFIA", 
    description: "Boost addicts and horsepower junkies",
    memberCount: 156,
    location: "South County",
    leader: "BOOST_DEMON",
    territory: "Highway 44 Corridor",
    reputation: 6891,
    isVerified: false,
  },
  {
    id: "4",
    name: "SPEED DEMONS",
    description: "Raw power and straight-line dominance",
    memberCount: 203,
    location: "North County",
    leader: "NITRO_NOVA",
    territory: "Airport District",
    reputation: 7156,
    isVerified: true,
  },
];

interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  role: "USER" | "ADMIN" | "MODERATOR";
}

interface ClubsClientProps {
  user: User;
  isAdmin: boolean;
  isModerator: boolean;
}

export default function ClubsClient({ user, isAdmin, isModerator }: ClubsClientProps) {
  const [selectedFilter, setSelectedFilter] = useState("all");

  const filteredClubs = mockClubs;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Admin Status Banner */}
        {(isAdmin || isModerator) && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-red-500" />
              <div>
                <div className="font-bold text-red-500">
                  {isAdmin ? "Admin Access" : "Moderator Access"}
                </div>
                <div className="text-sm text-white/70">
                  You have {isAdmin ? "full administrative" : "moderator"} privileges for managing clubs
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Street <span className="text-red-500">Clubs</span>
              </h1>
              <p className="text-white/70 text-lg">
                Join elite crews, dominate territories, and build your legend
              </p>
              {(isAdmin || isModerator) && (
                <p className="text-red-400 text-sm mt-1">
                  ⚡ Viewing with {isAdmin ? "admin" : "moderator"} privileges
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                asChild
                className="bg-red-500 hover:bg-red-600 text-white md:w-auto w-full"
              >
                <Link href="/clubs/create" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Club
                </Link>
              </Button>
              {isAdmin && (
                <Button
                  asChild
                  variant="outline"
                  className="border-red-500/30 text-red-500 hover:bg-red-500 hover:border-red-500 hover:text-white"
                >
                  <Link href="/admin/clubs" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Admin Panel
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-500">127</div>
              <div className="text-sm text-white/70">Active Clubs</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">2,847</div>
              <div className="text-sm text-white/70">Total Members</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">89</div>
              <div className="text-sm text-white/70">Territories Claimed</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">15,632</div>
              <div className="text-sm text-white/70">Active Challenges</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-8">
          <Button
            variant={selectedFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilter("all")}
            className={selectedFilter === "all" ? "bg-red-500 hover:bg-red-600" : "border-white/20 text-white/70"}
          >
            All Clubs
          </Button>
          <Button
            variant={selectedFilter === "verified" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilter("verified")}
            className={selectedFilter === "verified" ? "bg-red-500 hover:bg-red-600" : "border-white/20 text-white/70"}
          >
            Verified
          </Button>
          <Button
            variant={selectedFilter === "local" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilter("local")}
            className={selectedFilter === "local" ? "bg-red-500 hover:bg-red-600" : "border-white/20 text-white/70"}
          >
            Local
          </Button>
          {(isAdmin || isModerator) && (
            <Button
              variant={selectedFilter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("pending")}
              className={selectedFilter === "pending" ? "bg-red-500 hover:bg-red-600" : "border-white/20 text-white/70"}
            >
              Pending Review
            </Button>
          )}
        </div>

        {/* Clubs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club) => (
            <Card
              key={club.id}
              className="bg-black/60 border-red-500/20 hover:border-red-500/50 transition-all duration-300 group cursor-pointer"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-red-500" />
                    <CardTitle className="text-lg font-bold text-white group-hover:text-red-500 transition-colors">
                      {club.name}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {club.isVerified && (
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                        VERIFIED
                      </Badge>
                    )}
                    {(isAdmin || isModerator) && (
                      <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs">
                        STAFF
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription className="text-white/70">
                  {club.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Users className="w-4 h-4 text-red-500" />
                    <span>{club.memberCount} members</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span>{club.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-white/60">
                      Leader: <span className="text-red-500 font-medium">{club.leader}</span>
                    </div>
                    <div className="text-sm text-white/60">
                      Rep: <span className="text-white font-bold">{club.reputation.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">
                      Territory: {club.territory}
                    </Badge>
                  </div>
                  <div className="pt-2 flex gap-2">
                    <Button
                      asChild
                      size="sm"
                      className="flex-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 hover:border-red-500"
                    >
                      <Link href={`/clubs/${club.id}`}>
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Link>
                    </Button>
                    {(isAdmin || isModerator) && (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="border-yellow-500/30 text-yellow-500 hover:bg-yellow-500 hover:border-yellow-500 hover:text-black"
                      >
                        <Link href={`/admin/clubs/${club.id}`}>
                          <Settings className="w-3 h-3" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredClubs.length === 0 && (
          <div className="text-center py-12">
            <Crown className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white/70 mb-2">No clubs found</h3>
            <p className="text-white/50 mb-6">Try adjusting your search or create a new club</p>
            <Button
              asChild
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Link href="/clubs/create" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Your Club
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}