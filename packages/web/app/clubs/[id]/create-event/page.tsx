import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { CreateEventForm } from "../create-event-form";

export default async function CreateEventPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await currentUser();
  
  if (!user) {
    return notFound();
  }

  // Get user from database
  const dbUser = await db.user.findUnique({
    where: { clerkId: user.id },
  });

  if (!dbUser) {
    return notFound();
  }

  // Get club and check permissions
  const club = await db.club.findUnique({
    where: { id: params.id },
    include: {
      members: {
        where: { userId: dbUser.id },
      },
    },
  });

  if (!club) {
    return notFound();
  }

  // Check if user is admin
  const isAdmin = club.members.some((m) => m.role === "ADMIN");
  
  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>Only club admins can create events.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Create New Event</h1>
      <CreateEventForm clubId={club.id} isPremium={club.premium} />
    </div>
  );
} 