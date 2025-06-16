import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UserRole } from "@/shared";

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

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

  return user;
}

export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN";
}

export async function isModerator() {
  const user = await getCurrentUser();
  return user?.role === "MODERATOR" || user?.role === "ADMIN";
}

export async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) {
    throw new Error("Admin access required");
  }
  return true;
}

export async function requireModerator() {
  const moderator = await isModerator();
  if (!moderator) {
    throw new Error("Moderator access required");
  }
  return true;
}

// Helper to check if current user can access admin features
export async function canAccessAdminFeatures() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN" || user?.role === "MODERATOR";
}

// Helper to get user role for client components
export async function getUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser();
  return user?.role || null;
}