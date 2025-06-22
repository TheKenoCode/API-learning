"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Clock,
  Check,
  X,
  UserPlus,
  MessageSquare,
  Users
} from "lucide-react";
import { formatTimeShort } from "@/lib/utils";

interface JoinRequestManagerProps {
  clubId: string;
  canManage: boolean;
}

export default function JoinRequestManager({ clubId, canManage }: JoinRequestManagerProps) {
  const [processingRequestIds, setProcessingRequestIds] = useState<Set<string>>(new Set());
  
  // Fetch pending join requests
  const { data: joinRequests, isLoading, refetch } = api.club.getJoinRequests.useQuery({
    clubId,
  }, {
    enabled: canManage
  });
  
  // Handle join request mutation
  const handleJoinRequestMutation = api.club.handleJoinRequest.useMutation({
    onSuccess: () => {
      refetch();
    },
          onError: () => {
        // Handle error silently - tRPC will show error to user
        // TODO: Add error toast notification
      },
  });

  const handleJoinRequest = async (requestId: string, action: "approve" | "reject") => {
    // Add to processing state
    setProcessingRequestIds(prev => new Set(prev).add(requestId));
    
    try {
      await handleJoinRequestMutation.mutateAsync({
        requestId,
        action,
      });
    } catch (error) {
      // Error handled in mutation
    } finally {
      // Remove from processing state
      setProcessingRequestIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  if (!canManage) {
    return null;
  }

  const pendingRequests = joinRequests || [];
  const isProcessing = (requestId: string) => processingRequestIds.has(requestId);

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-orange-400" />
            Join Requests
            {pendingRequests.length > 0 && (
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 ml-2">
                {pendingRequests.length}
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white/5 rounded-lg h-20" />
            ))}
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60 font-medium">No pending requests</p>
            <p className="text-white/40 text-sm">All caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request: any) => (
              <div
                key={request.id}
                className="bg-white/5 border border-orange-500/20 rounded-xl p-4 hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  {/* User Avatar */}
                  <Avatar className="w-12 h-12 border border-white/20 flex-shrink-0">
                    <AvatarImage src={request.user.imageUrl || undefined} />
                    <AvatarFallback className="bg-orange-500/20 text-orange-400 font-bold">
                      {request.user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Request Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white truncate">
                        {request.user.name || "Anonymous User"}
                      </h4>
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                    
                    <p className="text-white/60 text-sm mb-3">
                      {request.user.email} • Requested {formatTimeShort(new Date(request.createdAt))}
                    </p>
                    
                    {/* Message if provided */}
                    {request.message && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-white/60" />
                          <span className="text-white/60 text-sm font-medium">Message:</span>
                        </div>
                        <p className="text-white/80 text-sm leading-relaxed">
                          &ldquo;{request.message}&rdquo;
                        </p>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleJoinRequest(request.id, "approve")}
                        disabled={isProcessing(request.id) || handleJoinRequestMutation.isLoading}
                        className="bg-green-500 hover:bg-green-600 text-white flex-1 sm:flex-none"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {isProcessing(request.id) ? "Approving..." : "Approve"}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleJoinRequest(request.id, "reject")}
                        disabled={isProcessing(request.id) || handleJoinRequestMutation.isLoading}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 flex-1 sm:flex-none"
                      >
                        <X className="w-4 h-4 mr-2" />
                        {isProcessing(request.id) ? "Rejecting..." : "Reject"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 