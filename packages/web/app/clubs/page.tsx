import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import ClubsClient from "./clubs-client";

// Server component that handles authentication and permissions
export default async function ClubsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  // Get user with role information
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      clerkId: true,
      email: true,
      name: true,
      imageUrl: true,
      role: true,
    },
  });

  if (!user) {
    redirect("/");
  }

  // Check if user has access to clubs (admin/moderator or regular access)
  const hasClubAccess = true; // You can modify this logic as needed
  const isAdmin = user.role === "ADMIN";
  const isModerator = user.role === "MODERATOR" || user.role === "ADMIN";

  if (!hasClubAccess) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-white/70">You don't have access to the clubs section.</p>
        </div>
      </div>
    );
  }

  return (
    <ClubsClient 
      user={user} 
      isAdmin={isAdmin} 
      isModerator={isModerator} 
    />
  );
}