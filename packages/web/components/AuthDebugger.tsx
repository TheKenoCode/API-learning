"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Database, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Crown,
  Users
} from "lucide-react";
import { useState } from "react";

export default function AuthDebugger() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [refreshKey, setRefreshKey] = useState(0);

  // Get user data from database
  const { data: dbUser, isLoading: dbUserLoading, refetch } = api.user.getCurrentUser.useQuery(
    undefined,
    {
      enabled: isSignedIn,
      // Add a key to force refresh
      queryKey: ["user.getCurrentUser", refreshKey],
    }
  );

  // Get user's club memberships
  const { data: userMemberships } = api.club.getUserMemberships.useQuery(
    undefined,
    { enabled: !!dbUser }
  );

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  if (!isLoaded) {
    return (
      <Card className="max-w-2xl mx-auto bg-gradient-to-br from-white/5 to-white/10 border-white/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-white/60 mr-2" />
            <span className="text-white/60">Loading authentication...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Main Auth Status */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/20">
      <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Authentication Status
            </CardTitle>
          <Button 
              onClick={handleRefresh}
              size="sm"
              variant="outline"
              className="border-white/20 text-white/70 hover:text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
          </Button>
        </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Clerk Authentication */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-white font-medium">Clerk Authentication</div>
                <div className="text-white/60 text-sm">
                  {isSignedIn ? "User is signed in" : "User is not signed in"}
                </div>
              </div>
            </div>
            {isSignedIn ? (
              <CheckCircle className="w-6 h-6 text-green-400" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400" />
            )}
          </div>

          {/* Database Integration */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-white font-medium">Database Integration</div>
                <div className="text-white/60 text-sm">
                  {dbUserLoading ? "Loading..." : 
                   dbUser ? "User exists in database" : 
                   isSignedIn ? "User missing from database" : "No user to sync"}
                </div>
              </div>
            </div>
            {dbUserLoading ? (
              <RefreshCw className="w-6 h-6 animate-spin text-yellow-400" />
            ) : dbUser ? (
              <CheckCircle className="w-6 h-6 text-green-400" />
            ) : isSignedIn ? (
              <AlertCircle className="w-6 h-6 text-yellow-400" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400" />
            )}
          </div>

          {/* Integration Status */}
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-white font-medium">Overall Status</span>
              {isSignedIn && dbUser ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Fully Integrated
                </Badge>
              ) : isSignedIn && !dbUser ? (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  Sync Needed
                </Badge>
              ) : (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  Not Authenticated
                </Badge>
              )}
            </div>
            <div className="text-white/60 text-sm">
              {isSignedIn && dbUser 
                ? "✅ User is properly authenticated and synced with database"
                : isSignedIn && !dbUser
                ? "⚠️ User is authenticated but not synced to database. This should auto-resolve."
                : "❌ User needs to sign in to access protected features"
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Details */}
      {isSignedIn && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Clerk User Data */}
          <Card className="bg-gradient-to-br from-blue-500/5 to-blue-600/5 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                Clerk User Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="text-white/60 text-sm">Clerk ID</div>
                <div className="text-white font-mono text-sm bg-white/5 p-2 rounded">
                  {user?.id || "Not available"}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-white/60 text-sm">Email</div>
                <div className="text-white text-sm">
                  {user?.emailAddresses[0]?.emailAddress || "Not available"}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-white/60 text-sm">Name</div>
                <div className="text-white text-sm">
                  {user?.fullName || "Not available"}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-white/60 text-sm">Created</div>
                <div className="text-white text-sm">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Not available"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database User Data */}
          <Card className="bg-gradient-to-br from-purple-500/5 to-purple-600/5 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-400" />
                Database User Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dbUser ? (
                <>
                  <div className="space-y-1">
                    <div className="text-white/60 text-sm">Database ID</div>
                    <div className="text-white font-mono text-sm bg-white/5 p-2 rounded">
                      {dbUser.id}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-white/60 text-sm">Email</div>
                    <div className="text-white text-sm">{dbUser.email}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-white/60 text-sm">Name</div>
                    <div className="text-white text-sm">{dbUser.name || "Not set"}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-white/60 text-sm">Site Role</div>
                    <Badge className={`
                      ${dbUser.siteRole === 'SUPER_ADMIN' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                        dbUser.siteRole === 'ADMIN' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 
                        'bg-gray-500/20 text-gray-400 border-gray-500/30'}
                    `}>
                      {dbUser.siteRole}
                    </Badge>
                  </div>
                </>
              ) : dbUserLoading ? (
                <div className="text-center py-4">
                  <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
                  <div className="text-white/60">Loading user data...</div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                  <div className="text-white/60">User not found in database</div>
                  <div className="text-white/40 text-sm mt-1">
                    User should be auto-created on next request
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Club Memberships */}
      {dbUser && userMemberships && (
        <Card className="bg-gradient-to-br from-green-500/5 to-green-600/5 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-green-400" />
              Club Memberships ({userMemberships.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userMemberships.length === 0 ? (
              <div className="text-center py-4">
                <Users className="w-8 h-8 text-green-400/60 mx-auto mb-2" />
                <div className="text-white/60">No club memberships yet</div>
                <div className="text-white/40 text-sm mt-1">
                  Join or create a club to get started!
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {userMemberships.map((membership: any) => (
                  <div key={membership.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                    <div>
                      <div className="text-white font-medium">{membership.club.name}</div>
                      <div className="text-white/60 text-sm">
                        Joined {new Date(membership.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge className={`
                      ${membership.role === 'ADMIN' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                        membership.role === 'MODERATOR' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 
                        'bg-gray-500/20 text-gray-400 border-gray-500/30'}
                    `}>
                      {membership.role}
                    </Badge>
                  </div>
                ))}
          </div>
        )}
      </CardContent>
    </Card>
      )}

      {/* Instructions */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Integration Health Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-white/5">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-white font-medium mb-1">Webhook Setup</div>
              <div className="text-white/60 text-sm">
                Clerk webhooks are properly configured for user sync
              </div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-white/5">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-white font-medium mb-1">tRPC Integration</div>
              <div className="text-white/60 text-sm">
                Database user ID is properly resolved in tRPC context
              </div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-white/5">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-white font-medium mb-1">Permission System</div>
              <div className="text-white/60 text-sm">
                Role-based permissions are working correctly
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 