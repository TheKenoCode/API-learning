import { z } from "zod";

// Enums
export const UserRoleEnum = z.enum(["USER", "ADMIN", "MODERATOR"]);

export const EscrowStatusEnum = z.enum([
  "PENDING",
  "FUNDED",
  "RELEASED",
  "DISPUTED",
  "REFUNDED",
]);

export const ScanTypeEnum = z.enum([
  "EXTERIOR",
  "INTERIOR",
  "ENGINE",
  "UNDERCARRIAGE",
  "DOCUMENTATION",
]);

// User schemas
export const UserSchema = z.object({
  id: z.string(),
  clerkId: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  imageUrl: z.string().optional(),
  role: UserRoleEnum.default("USER"),
});

// Car schemas
export const CarSchema = z.object({
  id: z.string(),
  make: z.string(),
  model: z.string(),
  year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  vin: z.string().length(17),
  color: z.string().optional(),
  mileage: z.number().int().nonnegative().optional(),
  description: z.string().optional(),
  glbUrl: z.string().optional(),
});

export const CreateCarSchema = CarSchema.omit({ id: true });

// Listing schemas
export const ListingSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  isActive: z.boolean().default(true),
  sellerId: z.string(),
  carId: z.string(),
});

export const CreateListingSchema = ListingSchema.omit({
  id: true,
  sellerId: true,
});

// Order schemas
export const OrderSchema = z.object({
  id: z.string(),
  amount: z.number().positive(),
  escrowStatus: EscrowStatusEnum.default("PENDING"),
  stripePaymentIntentId: z.string().optional(),
  coinbaseChargeId: z.string().optional(),
  buyerId: z.string(),
  listingId: z.string(),
});

export const CreateOrderSchema = z.object({
  listingId: z.string(),
  amount: z.number().positive(),
});

// Event schemas
export const EventSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  date: z.date(),
  location: z.string().min(1),
  isActive: z.boolean().default(true),
  organizerId: z.string(),
});

export const CreateEventSchema = EventSchema.omit({
  id: true,
  organizerId: true,
});

// Contest schemas
export const ContestSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  eventId: z.string(),
});

export const CreateContestSchema = ContestSchema.omit({ id: true });

// Vote schemas
export const VoteSchema = z.object({
  id: z.string(),
  rating: z.number().int().min(1).max(10),
  voterId: z.string(),
  contestId: z.string(),
});

export const CreateVoteSchema = VoteSchema.omit({
  id: true,
  voterId: true,
});

// Scan schemas
export const ScanSchema = z.object({
  id: z.string(),
  scanType: ScanTypeEnum,
  imageUrl: z.string().optional(),
  reportUrl: z.string().optional(),
  verified: z.boolean().default(false),
  notes: z.string().optional(),
  scannerId: z.string(),
  carId: z.string(),
});

export const CreateScanSchema = ScanSchema.omit({
  id: true,
  scannerId: true,
});

// Payment schemas
export const StripePaymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default("usd"),
  metadata: z.record(z.string()).optional(),
});

export const CoinbaseChargeSchema = z.object({
  name: z.string(),
  description: z.string(),
  pricing_type: z.literal("fixed_price"),
  local_price: z.object({
    amount: z.string(),
    currency: z.string().default("USD"),
  }),
});

// Utility types
export type UserRole = z.infer<typeof UserRoleEnum>;
export type User = z.infer<typeof UserSchema>;
export type Car = z.infer<typeof CarSchema>;
export type CreateCar = z.infer<typeof CreateCarSchema>;
export type Listing = z.infer<typeof ListingSchema>;
export type CreateListing = z.infer<typeof CreateListingSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
export type Event = z.infer<typeof EventSchema>;
export type CreateEvent = z.infer<typeof CreateEventSchema>;
export type Contest = z.infer<typeof ContestSchema>;
export type CreateContest = z.infer<typeof CreateContestSchema>;
export type Vote = z.infer<typeof VoteSchema>;
export type CreateVote = z.infer<typeof CreateVoteSchema>;
export type Scan = z.infer<typeof ScanSchema>;
export type CreateScan = z.infer<typeof CreateScanSchema>;
export type EscrowStatus = z.infer<typeof EscrowStatusEnum>;
export type ScanType = z.infer<typeof ScanTypeEnum>;

// Constants
export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const SUPPORTED_3D_TYPES = [
  "model/gltf-binary",
  "model/gltf+json",
] as const;

export const MAX_3D_FILE_SIZE = 50 * 1024 * 1024; // 50MB
