"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Link2,
  Copy,
  RefreshCw,
  QrCode,
  Settings,
  Calendar,
  Users,
  Check,
  Shield
} from "lucide-react";

interface InviteManagementProps {
  clubId: string;
  isAdmin: boolean;
}

export default function InviteManagement({ clubId, isAdmin }: InviteManagementProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Fetch club data with invite settings
  const { data: club, refetch: refetchClub } = api.club.getById.useQuery({ id: clubId });
  
  // Fetch invite settings
  const { data: inviteSettings } = api.club.getInviteSettings.useQuery(
    { clubId },
    { enabled: isAdmin }
  );

  // Generate new invite code mutation
  const generateCodeMutation = api.club.generateInviteCode.useMutation({
    onSuccess: () => {
      refetchClub();
    }
  });

  // Update invite settings mutation
  const updateSettingsMutation = api.club.updateInviteSettings.useMutation({
    onSuccess: () => {
      refetchClub();
    }
  });

  const inviteUrl = club?.inviteCode 
    ? `${window.location.origin}/join/${club.inviteCode}` 
    : "";

  const handleCopyInvite = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerateNew = () => {
    if (confirm("Generate a new invite code? The old code will become invalid.")) {
      generateCodeMutation.mutate({ clubId });
    }
  };

  const generateQRCode = () => {
    // QR code generation using external API
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteUrl)}`;
  };

  if (!isAdmin) {
    return (
      <Card className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10">
        <CardContent className="p-6 text-center">
          <Shield className="w-12 h-12 text-red-500/50 mx-auto mb-4" />
          <p className="text-white/60">Admin access required to manage invites</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Invite Code */}
      <Card className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-green-500" />
            Invite Link
          </CardTitle>
          <CardDescription className="text-white/60">
            Share this link to invite new members
          </CardDescription>
        </CardHeader>
        <CardContent>
          {club?.inviteCode ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-lg font-mono font-bold text-green-400">
                    {club.inviteCode}
                  </div>
                  <Button
                    size="sm"
                    onClick={handleCopyInvite}
                    className="bg-white/10 hover:bg-white/20"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="text-white/60 text-sm break-all">
                  {inviteUrl}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleGenerateNew}
                  disabled={generateCodeMutation.isLoading}
                  className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate New Code
                </Button>
                <Button
                  onClick={() => setShowQR(!showQR)}
                  className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  {showQR ? "Hide" : "Show"} QR
                </Button>
              </div>

              {showQR && (
                <div className="mt-4 p-4 bg-white rounded-xl text-center">
                  <img 
                    src={generateQRCode()} 
                    alt="Invite QR Code" 
                    className="mx-auto"
                  />
                  <p className="text-black/60 text-sm mt-2">Scan to join</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-white/60 mb-4">No invite code set</p>
              <Button
                onClick={handleGenerateNew}
                disabled={generateCodeMutation.isLoading}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate Invite Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Settings */}
      <Card className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" />
            Invite Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Max Members */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-white font-medium">Member Limit</div>
                  <div className="text-white/60 text-sm">
                    {inviteSettings?.maxMembers ? `${inviteSettings.maxMembers} members` : "Unlimited"}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const limit = prompt("Enter member limit (leave empty for unlimited):");
                  if (limit !== null) {
                    updateSettingsMutation.mutate({
                      clubId,
                      maxMembers: limit ? parseInt(limit) : undefined
                    });
                  }
                }}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Edit
              </Button>
            </div>

            {/* Invite Expiry */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="text-white font-medium">Invite Expiry</div>
                  <div className="text-white/60 text-sm">
                    {inviteSettings?.inviteExpiry 
                      ? new Date(inviteSettings.inviteExpiry).toLocaleDateString()
                      : "Never expires"}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const days = prompt("Expire invite after how many days? (leave empty for no expiry):");
                  if (days !== null) {
                    updateSettingsMutation.mutate({
                      clubId,
                      inviteExpiry: days ? new Date(Date.now() + parseInt(days) * 24 * 60 * 60 * 1000) : undefined
                    });
                  }
                }}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Edit
              </Button>
            </div>

            {/* Member Invites */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-white font-medium">Member Invites</div>
                  <div className="text-white/60 text-sm">
                    {inviteSettings?.allowMemberInvites 
                      ? "Members can invite others" 
                      : "Only admins can invite"}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  updateSettingsMutation.mutate({
                    clubId,
                    allowMemberInvites: !inviteSettings?.allowMemberInvites
                  });
                }}
                className="border-white/20 text-white hover:bg-white/10"
              >
                {inviteSettings?.allowMemberInvites ? "Disable" : "Enable"}
              </Button>
            </div>
          </div>

          {/* Invite Stats */}
          {inviteSettings?.inviteUsageCount !== undefined && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  {inviteSettings.inviteUsageCount}
                </div>
                <div className="text-white/60 text-sm">
                  Members joined via invite link
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 