"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, ArrowLeft, Users, MapPin, Trophy, Target, Calendar, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Mock club data - replace with actual tRPC query based on params.id
const mockClub = {
  id: "1",
  name: "MIDNIGHT RUNNERS",
  description: "Elite street crew dominating the downtown scene with precision builds and legendary drivers.",
  memberCount: 247,
  location: "Downtown St. Louis",
  leader: "BLACKOUT_STI",
  territory: "Financial District",
  reputation: 8547,
  isVerified: true,
  founded: "2023-03-15",
  totalWins: 156,
  totalChallenges: 203,
  activeChallenges: 12,
};

const mockMembers = [
  { name: "BLACKOUT_STI", role: "Leader", reputation: 2847, joined: "2023-03-15", isOnline: true },
  { name: "SPEED_DEMON", role: "Lieutenant", reputation: 2156, joined: "2023-03-20", isOnline: true },
  { name: "TURBO_GHOST", role: "Member", reputation: 1823, joined: "2023-04-01", isOnline: false },
  { name: "NITRO_KING", role: "Member", reputation: 1654, joined: "2023-04-10", isOnline: true },
  { name: "DRIFT_MASTER", role: "Member", reputation: 1432, joined: "2023-04-15", isOnline: false },
];

interface ClubPageProps {
  params: {
    id: string;
  };
}

export default function ClubPage({ params }: ClubPageProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-red-500/30 text-red-500 hover:bg-red-500 hover:border-red-500 hover:text-white"
            >
              <Link href="/clubs" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Clubs
              </Link>
            </Button>
          </div>

          {/* Club Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30">
                <Crown className="w-10 h-10 text-red-500" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{mockClub.name}</h1>
                  {mockClub.isVerified && (
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                      <Shield className="w-3 h-3 mr-1" />
                      VERIFIED
                    </Badge>
                  )}
                </div>
                <p className="text-white/70 text-lg max-w-2xl">{mockClub.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-white/60">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {mockClub.memberCount} members
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {mockClub.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Founded {new Date(mockClub.founded).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="bg-red-500 hover:bg-red-600 text-white">
                Join Club
              </Button>
              <Button variant="outline" className="border-red-500/30 text-red-500 hover:bg-red-500 hover:border-red-500 hover:text-white">
                Challenge
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-500">{mockClub.reputation.toLocaleString()}</div>
              <div className="text-sm text-white/70">Club Reputation</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{mockClub.totalWins}</div>
              <div className="text-sm text-white/70">Total Wins</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{mockClub.totalChallenges}</div>
              <div className="text-sm text-white/70">Challenges Completed</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{mockClub.activeChallenges}</div>
              <div className="text-sm text-white/70">Active Challenges</div>
            </CardContent>
          </Card>
        </div>

        {/* Territory Info */}
        <Card className="bg-black/60 border-red-500/20 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" />
              Territory Control
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-white">{mockClub.territory}</div>
                <div className="text-white/70">Primary territory under club control</div>
              </div>
              <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
                CONTROLLED
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "overview"
                ? "text-red-500 border-b-2 border-red-500"
                : "text-white/70 hover:text-white"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "members"
                ? "text-red-500 border-b-2 border-red-500"
                : "text-white/70 hover:text-white"
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setActiveTab("challenges")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "challenges"
                ? "text-red-500 border-b-2 border-red-500"
                : "text-white/70 hover:text-white"
            }`}
          >
            Challenges
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "members" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockMembers.map((member, index) => (
              <Card key={index} className="bg-black/60 border-red-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-white">{member.name}</div>
                    <div className={`w-2 h-2 rounded-full ${member.isOnline ? "bg-green-500" : "bg-gray-500"}`} />
                  </div>
                  <div className="text-sm text-red-500 mb-1">{member.role}</div>
                  <div className="text-sm text-white/60">
                    Rep: {member.reputation.toLocaleString()}
                  </div>
                  <div className="text-xs text-white/40">
                    Joined {new Date(member.joined).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {(activeTab === "overview" || activeTab === "challenges") && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-white/40" />
            </div>
            <h3 className="text-xl font-semibold text-white/70 mb-2">
              {activeTab === "overview" ? "Club Overview" : "Club Challenges"}
            </h3>
            <p className="text-white/50">
              {activeTab === "overview" 
                ? "Detailed club statistics and activity coming soon..." 
                : "Challenge history and active competitions coming soon..."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}