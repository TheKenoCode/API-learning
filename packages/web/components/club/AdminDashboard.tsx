"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Link2,
  BarChart3,
  Settings
} from "lucide-react";
import MemberManagement from "./MemberManagement";
import InviteManagement from "./InviteManagement";
import ClubSettings from "./ClubSettings";

interface AdminDashboardProps {
  clubId: string;
  isAdmin: boolean;
  isModerator: boolean;
  isSiteAdmin?: boolean;
  defaultTab?: string;
}

export default function AdminDashboard({
  clubId,
  isAdmin,
  isModerator,
  isSiteAdmin,
  defaultTab = "members"
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Update active tab when defaultTab prop changes
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h2>
        <p className="text-white/60">Manage your club members, invites, and settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white/5 p-1">
          <TabsTrigger value="members" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="invites" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
            <Link2 className="w-4 h-4 mr-2" />
            Invites
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          <MemberManagement
            clubId={clubId}
            isAdmin={isAdmin}
            isModerator={isModerator}
          />
        </TabsContent>

        <TabsContent value="invites" className="space-y-6">
          <InviteManagement
            clubId={clubId}
            isAdmin={isAdmin}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <ClubSettings
            clubId={clubId}
            isAdmin={isAdmin}
            isSiteAdmin={isSiteAdmin}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Club Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 text-lg mb-2">Analytics Coming Soon</p>
                <p className="text-white/40">Detailed club statistics and member insights will be available here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 