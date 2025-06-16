"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, ArrowLeft, MapPin, Users, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateClubPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    territory: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement club creation logic with tRPC
    console.log("Creating club:", formData);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
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
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <Crown className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-4xl font-bold mb-2">
              Create Your <span className="text-red-500">Club</span>
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Build your crew, establish your territory, and dominate the streets. 
              Your legend starts here.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <Card className="bg-black/60 border-red-500/20">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white">Club Details</CardTitle>
              <CardDescription className="text-white/70">
                Set up your club identity and territory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Club Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="MIDNIGHT RUNNERS"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:border-red-500/50 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Elite street crew dominating the downtown scene..."
                    rows={3}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:border-red-500/50 focus:outline-none resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Downtown St. Louis"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:border-red-500/50 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Territory
                  </label>
                  <input
                    type="text"
                    value={formData.territory}
                    onChange={(e) => setFormData({...formData, territory: e.target.value})}
                    placeholder="Financial District"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:border-red-500/50 focus:outline-none"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3"
                >
                  Create Club
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Info Section */}
          <div className="space-y-6">
            <Card className="bg-red-500/10 border-red-500/20">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-red-500">Club Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-white">Build Your Crew</div>
                      <div className="text-sm text-white/70">Recruit members and grow your influence</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-white">Claim Territory</div>
                      <div className="text-sm text-white/70">Establish dominance in your area</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-white">Compete Together</div>
                      <div className="text-sm text-white/70">Team challenges and tournaments</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white">Club Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Minimum Members</span>
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                      1 (You)
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Territory Size</span>
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                      1 Block Min
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Club Fee</span>
                    <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                      FREE
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <p className="text-white/50 text-sm">
                By creating a club, you agree to follow our community guidelines 
                and territorial dispute resolution protocols.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}