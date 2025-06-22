import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

const f = createUploadthing();

export const ourFileRouter = {
  // Club profile picture uploader
  clubProfileImage: f({ image: { maxFileSize: "4MB" } })
        .middleware(async ({ req }) => {
      // Authenticate user
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");

      // Get club ID from request header
      const clubId = req.headers.get("x-club-id");
      if (!clubId) throw new Error("Club ID is required");

      // Find user in database
      const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        select: { id: true, siteRole: true },
      });

      if (!dbUser) {
        throw new Error("User not found in database");
      }

      // Check permissions: site admin OR club admin
      const isSiteAdmin = dbUser.siteRole === "SUPER_ADMIN" || dbUser.siteRole === "ADMIN";
      
      if (!isSiteAdmin) {
        // Check if user is club admin
        const clubMember = await db.clubMember.findUnique({
          where: {
            userId_clubId: {
              userId: dbUser.id,
              clubId,
            },
          },
        });

        const isClubAdmin = clubMember?.role === "ADMIN";
        if (!isClubAdmin) {
          throw new Error("Unauthorized: Must be club admin to upload profile picture");
        }
      }

      return { userId: dbUser.id, clubId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        // Update club with new image URL (using non-deprecated ufsUrl)
        await db.club.update({
          where: { id: metadata.clubId },
          data: { imageUrl: file.ufsUrl },
        });

        // Return metadata that will be sent to the client
        return { 
          uploadedBy: metadata.userId, 
          clubId: metadata.clubId, 
          imageUrl: file.ufsUrl 
        };
      } catch (error) {
        console.error("❌ UploadThing onUploadComplete Error:", error);
        throw error;
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter; 