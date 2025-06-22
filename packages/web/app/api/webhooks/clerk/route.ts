/**
 * Clerk Webhook Handler
 * 
 * Handles user lifecycle events from Clerk:
 * - user.created: Creates user in database
 * - user.updated: Updates user information
 * - user.deleted: Removes user from database
 * 
 * Security: Validates webhook signatures using Svix
 */
import { headers } from "next/headers";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new NextResponse("Error occured", {
      status: 400,
    });
  }

  const eventType = evt.type;

  try {
    switch (eventType) {
      case "user.created":
        await handleUserCreated(evt);
        break;
      case "user.updated":
        await handleUserUpdated(evt);
        break;
      case "user.deleted":
        await handleUserDeleted(evt);
        break;
      default:
        // Silently ignore other event types
        break;
    }
  } catch (error) {
    console.error(`Error handling webhook event ${eventType}:`, error);
    return new NextResponse("Error processing webhook", { status: 500 });
  }

  return new NextResponse("", { status: 200 });
}

async function handleUserCreated(evt: WebhookEvent) {
  if (evt.type !== "user.created") return;
  
  const userData = evt.data;
  const clerkId = userData.id;
  
  // Type guard and safe access to user properties
  const emailAddresses = userData.email_addresses || [];
  const primaryEmailAddress = emailAddresses.find((email: any) => 
    email.id === userData.primary_email_address_id
  );
  
  if (!primaryEmailAddress?.email_address) {
    throw new Error("No primary email found for user");
  }

  const firstName = userData.first_name || "";
  const lastName = userData.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim() || null;

  try {
    await db.user.create({
      data: {
        clerkId,
        email: primaryEmailAddress.email_address,
        name: fullName,
        imageUrl: userData.image_url || null,
      },
    });

  } catch (error) {
    // Handle case where user might already exist
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      // User already exists, which is fine
      return;
    } else {
      throw error;
    }
  }
}

async function handleUserUpdated(evt: WebhookEvent) {
  if (evt.type !== "user.updated") return;
  
  const userData = evt.data;
  const clerkId = userData.id;

  // Type guard and safe access to user properties
  const emailAddresses = userData.email_addresses || [];
  const primaryEmailAddress = emailAddresses.find((email: any) => 
    email.id === userData.primary_email_address_id
  );
  
  if (!primaryEmailAddress?.email_address) {
    throw new Error("No primary email found for user");
  }

  const firstName = userData.first_name || "";
  const lastName = userData.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim() || null;

  await db.user.update({
    where: { clerkId },
    data: {
      email: primaryEmailAddress.email_address,
      name: fullName,
      imageUrl: userData.image_url || null,
    },
  });
}

async function handleUserDeleted(evt: WebhookEvent) {
  if (evt.type !== "user.deleted") return;
  
  const userData = evt.data;
  const clerkId = userData.id;

  await db.user.delete({
    where: { clerkId },
  });
} 