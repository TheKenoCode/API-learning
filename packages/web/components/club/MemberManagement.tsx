"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Crown,
  Shield,
  Users,
  UserMinus,
  Ban,
  Clock,
  Check,
  X,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MemberManagementProps {
  clubId: string;
  isAdmin: boolean;
  isModerator: boolean;
}

export default function MemberManagement({ clubId, isAdmin, isModerator }: MemberManagementProps) {
  const [selectedTab, setSelectedTab] = useState("members");

  // Fetch club data with members
  const { data: club, refetch: refetchClub } = api.club.getById.useQuery({ id: clubId });

  // Fetch join requests
  const { data: joinRequests, refetch: refetchRequests } = api.club.getJoinRequests.useQuery(
    { clubId },
    { enabled: isAdmin || isModerator }
  );

  // Fetch banned members
  const { data: bannedMembers, refetch: refetchBanned } = api.club.getBannedMembers.useQuery(
    { clubId },
    { enabled: isAdmin }
  );

  // Mutations
  const updateRoleMutation = api.club.updateMemberRole.useMutation({
    onSuccess: () => {
      refetchClub();
    }
  });

  const handleJoinRequestMutation = api.club.handleJoinRequest.useMutation({
    onSuccess: () => {
      refetchRequests();
      refetchClub();
    }
  });

  const banMemberMutation = api.club.banMember.useMutation({
    onSuccess: () => {
      refetchClub();
      refetchBanned();
    }
  });

  const unbanMemberMutation = api.club.unbanMember.useMutation({
    onSuccess: () => {
      refetchBanned();
    }
  });

  const removeMemberMutation = api.club.removeMember.useMutation({
    onSuccess: () => {
      refetchClub();
    }
  });

  const handleRoleChange = (member: any, newRole: "ADMIN" | "MODERATOR" | "MEMBER") => {
    updateRoleMutation.mutate({
      clubId,
      userId: member.user.id,
      role: newRole
    });
  };

  const handleBan = (member: any, reason?: string, duration: number = 30) => {
    banMemberMutation.mutate({
      clubId,
      userId: member.user.id,
      reason,
      permanent: duration === -1,
      durationDays: duration === -1 ? undefined : duration
    });
  };

  return (
    <div className="space-y-6">
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="w-full bg-white/5 border border-white/10">
          <TabsTrigger value="members" className="flex-1 data-[state=active]:bg-red-500/20">
            <Users className="w-4 h-4 mr-2" />
            Members ({club?.members.length || 0})
          </TabsTrigger>
          {(isAdmin || isModerator) && (
            <TabsTrigger value="requests" className="flex-1 data-[state=active]:bg-yellow-500/20">
              <Clock className="w-4 h-4 mr-2" />
              Requests ({joinRequests?.length || 0})
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="banned" className="flex-1 data-[state=active]:bg-red-500/20">
              <Ban className="w-4 h-4 mr-2" />
              Banned ({bannedMembers?.length || 0})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-6">
          <div className="space-y-3">
            {club?.members.map((member: any) => (
              <Card key={member.id} className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={member.user.imageUrl} />
                        <AvatarFallback className="bg-white/10 text-white">
                          {member.user.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          {member.user.name}
                          {member.userId === club.creatorId && (
                            <Badge className="bg-red-500/20 text-red-400 border-0 text-xs">
                              Founder
                            </Badge>
                          )}
                        </div>
                        <div className="text-white/60 text-sm">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={`border-0 ${
                        member.role === "ADMIN" ? "bg-red-500/20 text-red-400" :
                        member.role === "MODERATOR" ? "bg-blue-500/20 text-blue-400" :
                        "bg-gray-500/20 text-gray-400"
                      }`}>
                        {member.role === "ADMIN" && <Crown className="w-3 h-3 mr-1" />}
                        {member.role === "MODERATOR" && <Shield className="w-3 h-3 mr-1" />}
                        {member.role}
                      </Badge>

                      {isAdmin && member.userId !== club.creatorId && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-black/90 border-white/10">
                            <DropdownMenuLabel className="text-white/60">Manage Member</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/10" />
                            
                            {member.role !== "ADMIN" && (
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(member, "ADMIN")}
                                className="text-white hover:bg-red-500/20"
                              >
                                <Crown className="w-4 h-4 mr-2" />
                                Promote to Admin
                              </DropdownMenuItem>
                            )}
                            
                            {member.role !== "MODERATOR" && (
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(member, "MODERATOR")}
                                className="text-white hover:bg-blue-500/20"
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                {member.role === "ADMIN" ? "Demote to" : "Promote to"} Moderator
                              </DropdownMenuItem>
                            )}
                            
                            {member.role !== "MEMBER" && (
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(member, "MEMBER")}
                                className="text-white hover:bg-gray-500/20"
                              >
                                <Users className="w-4 h-4 mr-2" />
                                Demote to Member
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator className="bg-white/10" />
                            
                            <DropdownMenuItem
                              onClick={() => {
                                const reason = prompt("Reason for ban (optional):");
                                const duration = prompt("Ban duration in days (or -1 for permanent):", "30");
                                if (duration !== null) {
                                  handleBan(member, reason || undefined, parseInt(duration));
                                }
                              }}
                              className="text-red-400 hover:bg-red-500/20"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Ban Member
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem
                              onClick={() => {
                                if (confirm("Are you sure you want to remove this member?")) {
                                  removeMemberMutation.mutate({ clubId, userId: member.user.id });
                                }
                              }}
                              className="text-red-400 hover:bg-red-500/20"
                            >
                              <UserMinus className="w-4 h-4 mr-2" />
                              Remove from Club
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Join Requests Tab */}
        <TabsContent value="requests" className="mt-6">
          {joinRequests?.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">No pending join requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {joinRequests?.map((request: any) => (
                <Card key={request.id} className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={request.user.imageUrl} />
                          <AvatarFallback className="bg-white/10 text-white">
                            {request.user.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-white">{request.user.name}</div>
                          <div className="text-white/60 text-sm">
                            Requested {new Date(request.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleJoinRequestMutation.mutate({ 
                            requestId: request.id, 
                            action: "approve" 
                          })}
                          disabled={handleJoinRequestMutation.isLoading}
                          className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleJoinRequestMutation.mutate({ 
                            requestId: request.id, 
                            action: "reject" 
                          })}
                          disabled={handleJoinRequestMutation.isLoading}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Banned Members Tab */}
        <TabsContent value="banned" className="mt-6">
          {bannedMembers?.length === 0 ? (
            <div className="text-center py-8">
              <Ban className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">No banned members</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bannedMembers?.map((ban: any) => (
                <Card key={ban.id} className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={ban.user.imageUrl} />
                          <AvatarFallback className="bg-red-500/20 text-red-400">
                            {ban.user.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-white">{ban.user.name}</div>
                          <div className="text-white/60 text-sm">
                            Banned by {ban.bannedBy.name} on {new Date(ban.createdAt).toLocaleDateString()}
                          </div>
                          {ban.reason && (
                            <div className="text-red-400 text-sm mt-1">
                              Reason: {ban.reason}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-500/20 text-red-400 border-0">
                          {ban.isPermanent ? "Permanent" : `Expires ${new Date(ban.expiresAt).toLocaleDateString()}`}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => unbanMemberMutation.mutate({ clubId, userId: ban.user.id })}
                          disabled={unbanMemberMutation.isLoading}
                          className="border-green-500/30 text-green-400 hover:bg-green-500/20"
                        >
                          Unban
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 