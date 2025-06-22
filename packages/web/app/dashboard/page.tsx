import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Users, Calendar } from "lucide-react";

export default async function DashboardPage() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect("/");
  }

  // Get user data from database
  const dbUser = await db.user.findUnique({
    where: { clerkId },
    include: {
      clubMemberships: {
        include: {
          club: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-white/60">Welcome to your automotive community platform</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Overview */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5 text-red-500" />
                Profile Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-white/60 text-sm">Name</p>
                <p className="text-white font-medium">{dbUser?.name || "Welcome!"}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Email</p>
                <p className="text-white font-medium">{dbUser?.email || "Not available"}</p>
              </div>
              {dbUser && (
                <div>
                  <p className="text-white/60 text-sm">Member Since</p>
                  <p className="text-white font-medium">
                    {new Date(dbUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Community Stats */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-red-500" />
                Community
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">Clubs Joined</span>
                <span className="text-white font-medium">{dbUser?.clubMemberships.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Account Type</span>
                <Badge variant="outline" className="border-white/20 text-white">
                  Member
                </Badge>
              </div>
              {dbUser && dbUser.clubMemberships.length > 0 && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-white/60 text-sm mb-2">Your Clubs:</p>
                  {dbUser.clubMemberships.slice(0, 3).map((membership) => (
                    <p key={membership.id} className="text-white text-sm">
                      • {membership.club.name}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center py-4">
                <p className="text-white/60 text-sm">No recent activity</p>
                <p className="text-white/40 text-xs mt-1">Start by joining a club or creating one!</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <a 
                  href="/clubs" 
                  className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:bg-white/10 transition-colors"
                >
                  <div className="text-red-500 font-semibold">Browse Clubs</div>
                  <div className="text-white/60 text-sm mt-1">Find your crew</div>
                </a>
                <a 
                  href="/clubs/create" 
                  className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:bg-white/10 transition-colors"
                >
                  <div className="text-red-500 font-semibold">Create Club</div>
                  <div className="text-white/60 text-sm mt-1">Start your own</div>
                </a>
                <a 
                  href="/marketplace" 
                  className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:bg-white/10 transition-colors"
                >
                  <div className="text-red-500 font-semibold">Marketplace</div>
                  <div className="text-white/60 text-sm mt-1">Buy & sell parts</div>
                </a>
                <a 
                  href="/events" 
                  className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:bg-white/10 transition-colors"
                >
                  <div className="text-red-500 font-semibold">Events</div>
                  <div className="text-white/60 text-sm mt-1">Join meetups</div>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message for New Users */}
        {!dbUser && (
          <div className="mt-8">
            <Card className="bg-red-500/10 border-red-500/20">
              <CardHeader>
                <CardTitle className="text-red-400">Welcome to the Platform!</CardTitle>
              </CardHeader>
              <CardContent className="text-white/70">
                <p className="mb-4">
                  Get started by exploring clubs in your area or creating your own automotive community.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
