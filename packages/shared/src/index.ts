import { z } from "zod";

// Enums
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

export const SiteRoleEnum = z.enum([
  "SUPER_ADMIN",
  "ADMIN", 
  "USER",
]);

export const ClubJoinRequestStatusEnum = z.enum([
  "PENDING",
  "APPROVED", 
  "REJECTED",
]);

// User schemas
export const UserSchema = z.object({
  id: z.string(),
  clerkId: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  imageUrl: z.string().optional(),
  siteRole: SiteRoleEnum.default("USER"),
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

// New Event System Enums
export const EventStatusEnum = z.enum([
  "DRAFT",
  "PUBLISHED",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
]);

export const ChallengeStatusEnum = z.enum([
  "PENDING",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
]);

// Legacy Event schemas (for old event system)
export const LegacyEventSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  date: z.date(),
  location: z.string().min(1),
  isActive: z.boolean().default(true),
  organizerId: z.string(),
});

export const CreateLegacyEventSchema = LegacyEventSchema.omit({
  id: true,
  organizerId: true,
});

// Event schemas (new event system)
export const EventSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  location: z.string().min(1),
  startDateTime: z.date(),
  endDateTime: z.date(),
  isPublic: z.boolean().default(true),
  entryFeeUSD: z.number().positive().optional(),
  maxAttendees: z.number().int().positive().optional(),
  premiumFeaturesEnabled: z.boolean().default(false),
  sponsorAssets: z.any().optional(), // JSON
  status: EventStatusEnum,
  clubId: z.string(),
  organizerId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  location: z.string().min(1),
  startDateTime: z.date(),
  endDateTime: z.date(),
  isPublic: z.boolean().default(true),
  entryFeeUSD: z.number().positive().optional(),
  maxAttendees: z.number().int().positive().optional(),
  sponsorAssets: z.any().optional(),
  clubId: z.string(),
  // Challenges to create with the event
  challenges: z.array(z.object({
    title: z.string().min(1).max(200),
    description: z.string().min(1),
    entryFeeUSD: z.number().positive().optional(),
    bonusPoolPercentOfEventFees: z.number().min(0).max(100).default(0),
  })).optional(),
});

export const EventChallengeSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string(),
  entryFeeUSD: z.number().positive().optional(),
  bonusPoolPercentOfEventFees: z.number().min(0).max(100),
  status: ChallengeStatusEnum,
  firstPlaceUserId: z.string().optional(),
  secondPlaceUserId: z.string().optional(),
  thirdPlaceUserId: z.string().optional(),
  payoutsReleasedAt: z.date().optional(),
  eventId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const EventEntrySchema = z.object({
  id: z.string(),
  eventId: z.string(),
  userId: z.string(),
  stripePaymentIntentId: z.string().optional(),
  checkedInAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ChallengeEntrySchema = z.object({
  id: z.string(),
  challengeId: z.string(),
  userId: z.string(),
  stripePaymentIntentId: z.string().optional(),
  createdAt: z.date(),
});

export const RegisterForEventSchema = z.object({
  eventId: z.string(),
});

export const EnterChallengeSchema = z.object({
  challengeId: z.string(),
});

export const CompleteChallengeSchema = z.object({
  challengeId: z.string(),
  firstPlaceUserId: z.string(),
  secondPlaceUserId: z.string(),
  thirdPlaceUserId: z.string(),
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
export type User = z.infer<typeof UserSchema>;
export type Car = z.infer<typeof CarSchema>;
export type CreateCar = z.infer<typeof CreateCarSchema>;
export type Listing = z.infer<typeof ListingSchema>;
export type CreateListing = z.infer<typeof CreateListingSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
export type LegacyEvent = z.infer<typeof LegacyEventSchema>;
export type CreateLegacyEvent = z.infer<typeof CreateLegacyEventSchema>;
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

// New Enums for Club System
export const ClubRoleEnum = z.enum(["ADMIN", "MODERATOR", "MEMBER"]);

export const ChallengeTypeEnum = z.enum([
  "TIME_TRIAL",
  "DISTANCE", 
  "FUEL_EFFICIENCY",
  "PHOTO_CONTEST",
  "CUSTOM",
]);

export const DifficultyEnum = z.enum(["EASY", "MEDIUM", "HARD", "EXPERT"]);

export const LeaderboardScopeEnum = z.enum([
  "GLOBAL",
  "CITY", 
  "TERRITORY",
  "CLUB",
]);

export const AttendanceStatusEnum = z.enum([
  "PENDING",
  "ATTENDING",
  "NOT_ATTENDING",
]);

export const ConditionEnum = z.enum([
  "NEW",
  "LIKE_NEW", 
  "GOOD",
  "FAIR",
  "POOR",
]);

export const FriendshipStatusEnum = z.enum([
  "PENDING",
  "ACCEPTED",
  "BLOCKED",
]);

export const SubscriptionTierEnum = z.enum(["FREE", "PREMIUM", "PRO"]);

export const SubscriptionStatusEnum = z.enum([
  "ACTIVE",
  "CANCELED",
  "PAST_DUE", 
  "INCOMPLETE",
]);

// Club schemas
export const ClubSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  isPrivate: z.boolean().default(false),
  inviteCode: z.string().optional(),
  city: z.string().optional(),
  territory: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  creatorId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateClubSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  isPrivate: z.boolean().default(false),
  city: z.string().optional(),
  territory: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const UpdateClubSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  isPrivate: z.boolean().optional(),
  city: z.string().optional(),
  territory: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const JoinClubSchema = z.object({
  clubId: z.string(),
});

export const JoinByInviteSchema = z.object({
  inviteCode: z.string(),
});

export const CancelJoinRequestSchema = z.object({
  clubId: z.string(),
});

export const DeleteClubSchema = z.object({
  clubId: z.string(),
  confirmation: z.string().refine(
    (val) => val === "delete",
    { message: "You must type 'delete' to confirm" }
  ),
});

export const SearchClubsSchema = z.object({
  query: z.string().optional(),
  city: z.string().optional(),
  territory: z.string().optional(),
  isPrivate: z.boolean().optional(),
  limit: z.number().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

// Club Member schemas
export const ClubMemberSchema = z.object({
  id: z.string(),
  role: ClubRoleEnum,
  joinedAt: z.date(),
  userId: z.string(),
  clubId: z.string(),
});

export const UpdateMemberRoleSchema = z.object({
  clubId: z.string(),
  userId: z.string(),
  role: ClubRoleEnum,
});

// Challenge schemas
export const ChallengeSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string(),
  type: ChallengeTypeEnum,
  isPreMade: z.boolean().default(false),
  difficulty: DifficultyEnum,
  city: z.string().optional(),
  territory: z.string().optional(),
  isGlobal: z.boolean().default(false),
  parameters: z.any(), // JSON
  clubId: z.string().optional(),
  creatorId: z.string(),
  isActive: z.boolean().default(true),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateChallengeSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  type: ChallengeTypeEnum,
  difficulty: DifficultyEnum,
  city: z.string().optional(),
  territory: z.string().optional(),
  isGlobal: z.boolean().default(false),
  parameters: z.any().optional(),
  clubId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export const ParticipateInChallengeSchema = z.object({
  challengeId: z.string(),
});

export const SubmitChallengeResultSchema = z.object({
  challengeId: z.string(),
  score: z.number(),
  evidence: z.any().optional(), // JSON for photos, videos, data
});

export const GetPreMadeChallengesSchema = z.object({
  type: ChallengeTypeEnum.optional(),
  difficulty: DifficultyEnum.optional(),
  city: z.string().optional(),
  territory: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export const GetLeaderboardSchema = z.object({
  challengeId: z.string(),
  scope: LeaderboardScopeEnum,
  scopeValue: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
});

// Challenge Participant schemas
export const ChallengeParticipantSchema = z.object({
  id: z.string(),
  score: z.number().optional(),
  completedAt: z.date().optional(),
  evidence: z.any().optional(),
  userId: z.string(),
  challengeId: z.string(),
  createdAt: z.date(),
});

// Leaderboard Entry schemas
export const LeaderboardEntrySchema = z.object({
  id: z.string(),
  rank: z.number().int().positive(),
  score: z.number(),
  scope: LeaderboardScopeEnum,
  scopeValue: z.string().optional(),
  userId: z.string(),
  challengeId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Club Event schemas
export const ClubEventSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  date: z.date(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  maxAttendees: z.number().int().positive().optional(),
  clubId: z.string(),
  organizerId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateClubEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  date: z.date(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  maxAttendees: z.number().int().positive().optional(),
  clubId: z.string(),
});

export const UpdateEventAttendanceSchema = z.object({
  eventId: z.string(),
  status: AttendanceStatusEnum,
});

// Event Attendee schemas
export const EventAttendeeSchema = z.object({
  id: z.string(),
  status: AttendanceStatusEnum,
  userId: z.string(),
  eventId: z.string(),
});

// Marketplace Post schemas
export const MarketplacePostSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  price: z.number().positive().optional(),
  images: z.array(z.string()),
  category: z.string().min(1),
  condition: ConditionEnum,
  isActive: z.boolean().default(true),
  sellerId: z.string(),
  clubId: z.string().optional(),
  city: z.string().optional(),
  location: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateMarketplacePostSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  price: z.number().positive().optional(),
  images: z.array(z.string()).max(10),
  category: z.string().min(1),
  condition: ConditionEnum,
  clubId: z.string().optional(),
  city: z.string().optional(),
  location: z.string().optional(),
});

export const SearchMarketplaceSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  condition: ConditionEnum.optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  city: z.string().optional(),
  clubId: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

// Friendship schemas
export const FriendshipSchema = z.object({
  id: z.string(),
  status: FriendshipStatusEnum,
  requesterId: z.string(),
  addresseeId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const SendFriendRequestSchema = z.object({
  addresseeId: z.string(),
});

export const RespondToFriendRequestSchema = z.object({
  friendshipId: z.string(),
  accept: z.boolean(),
});

export const SearchUsersSchema = z.object({
  query: z.string().min(1),
  limit: z.number().min(1).max(50).default(20),
});

// Club Post schemas
export const ClubPostSchema = z.object({
  id: z.string(),
  content: z.string().min(1).max(2000),
  images: z.array(z.string()),
  authorId: z.string(),
  clubId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateClubPostSchema = z.object({
  content: z.string().min(1).max(2000),
  images: z.array(z.string()).max(10).default([]),
  clubId: z.string(),
});

export const LikePostSchema = z.object({
  postId: z.string(),
});

export const CommentOnPostSchema = z.object({
  postId: z.string(),
  content: z.string().min(1).max(500),
  parentId: z.string().optional(), // For threaded replies
});

export const LikeCommentSchema = z.object({
  commentId: z.string(),
});

// Post Like schemas
export const PostLikeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  postId: z.string(),
  createdAt: z.date(),
});

// Post Comment schemas
export const PostCommentSchema = z.object({
  id: z.string(),
  content: z.string(),
  authorId: z.string(),
  postId: z.string(),
  parentId: z.string().optional(), // For threaded replies
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Comment Like schemas
export const CommentLikeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  commentId: z.string(),
  createdAt: z.date(),
});

// Subscription schemas
export const SubscriptionSchema = z.object({
  id: z.string(),
  tier: SubscriptionTierEnum,
  status: SubscriptionStatusEnum,
  stripeCustomerId: z.string().optional(),
  stripePriceId: z.string().optional(),
  userId: z.string(),
  currentPeriodStart: z.date(),
  currentPeriodEnd: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateSubscriptionSchema = z.object({
  tier: SubscriptionTierEnum,
  stripePriceId: z.string(),
});

export const UpdateSubscriptionSchema = z.object({
  tier: SubscriptionTierEnum.optional(),
  status: SubscriptionStatusEnum.optional(),
});

// Geographic schemas
export const LocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  city: z.string().optional(),
  territory: z.string().optional(),
});

export const GetLocationFromCoordinatesSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

// New type exports
export type ClubRole = z.infer<typeof ClubRoleEnum>;
export type ChallengeType = z.infer<typeof ChallengeTypeEnum>;
export type Difficulty = z.infer<typeof DifficultyEnum>;
export type LeaderboardScope = z.infer<typeof LeaderboardScopeEnum>;
export type AttendanceStatus = z.infer<typeof AttendanceStatusEnum>;
export type Condition = z.infer<typeof ConditionEnum>;
export type FriendshipStatus = z.infer<typeof FriendshipStatusEnum>;
export type SubscriptionTier = z.infer<typeof SubscriptionTierEnum>;
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusEnum>;
export type SiteRole = z.infer<typeof SiteRoleEnum>;
export type ClubJoinRequestStatus = z.infer<typeof ClubJoinRequestStatusEnum>;

export type Club = z.infer<typeof ClubSchema>;
export type CreateClub = z.infer<typeof CreateClubSchema>;
export type UpdateClub = z.infer<typeof UpdateClubSchema>;
export type JoinClub = z.infer<typeof JoinClubSchema>;
export type JoinByInvite = z.infer<typeof JoinByInviteSchema>;
export type CancelJoinRequest = z.infer<typeof CancelJoinRequestSchema>;
export type DeleteClub = z.infer<typeof DeleteClubSchema>;
export type SearchClubs = z.infer<typeof SearchClubsSchema>;

export type ClubMember = z.infer<typeof ClubMemberSchema>;
export type UpdateMemberRole = z.infer<typeof UpdateMemberRoleSchema>;

export type Challenge = z.infer<typeof ChallengeSchema>;
export type CreateChallenge = z.infer<typeof CreateChallengeSchema>;
export type ParticipateInChallenge = z.infer<typeof ParticipateInChallengeSchema>;
export type SubmitChallengeResult = z.infer<typeof SubmitChallengeResultSchema>;
export type GetPreMadeChallenges = z.infer<typeof GetPreMadeChallengesSchema>;
export type GetLeaderboard = z.infer<typeof GetLeaderboardSchema>;

export type ChallengeParticipant = z.infer<typeof ChallengeParticipantSchema>;
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

export type ClubEvent = z.infer<typeof ClubEventSchema>;
export type CreateClubEvent = z.infer<typeof CreateClubEventSchema>;
export type UpdateEventAttendance = z.infer<typeof UpdateEventAttendanceSchema>;
export type EventAttendee = z.infer<typeof EventAttendeeSchema>;

export type MarketplacePost = z.infer<typeof MarketplacePostSchema>;
export type CreateMarketplacePost = z.infer<typeof CreateMarketplacePostSchema>;
export type SearchMarketplace = z.infer<typeof SearchMarketplaceSchema>;

export type Friendship = z.infer<typeof FriendshipSchema>;
export type SendFriendRequest = z.infer<typeof SendFriendRequestSchema>;
export type RespondToFriendRequest = z.infer<typeof RespondToFriendRequestSchema>;
export type SearchUsers = z.infer<typeof SearchUsersSchema>;

export type ClubPost = z.infer<typeof ClubPostSchema>;
export type CreateClubPost = z.infer<typeof CreateClubPostSchema>;
export type LikePost = z.infer<typeof LikePostSchema>;
export type CommentOnPost = z.infer<typeof CommentOnPostSchema>;
export type LikeComment = z.infer<typeof LikeCommentSchema>;

export type PostLike = z.infer<typeof PostLikeSchema>;
export type PostComment = z.infer<typeof PostCommentSchema>;
export type CommentLike = z.infer<typeof CommentLikeSchema>;

export type Subscription = z.infer<typeof SubscriptionSchema>;
export type CreateSubscription = z.infer<typeof CreateSubscriptionSchema>;
export type UpdateSubscription = z.infer<typeof UpdateSubscriptionSchema>;

export type Location = z.infer<typeof LocationSchema>;
export type GetLocationFromCoordinates = z.infer<typeof GetLocationFromCoordinatesSchema>;

export const AdminMessageTypeEnum = z.enum(["INFO", "ANNOUNCEMENT", "WARNING"]);

// Enhanced Club Admin Schemas
export const BanMemberSchema = z.object({
  clubId: z.string(),
  userId: z.string(),
  reason: z.string().optional(),
  permanent: z.boolean().default(false),
  durationDays: z.number().positive().optional(),
});

export const UnbanMemberSchema = z.object({
  clubId: z.string(),
  userId: z.string(),
});

export const BulkMemberActionsSchema = z.object({
  clubId: z.string(),
  userIds: z.array(z.string()),
  action: z.enum(["remove", "promote_moderator", "demote_member", "ban"]),
  banReason: z.string().optional(),
});

export const GetBannedMembersSchema = z.object({
  clubId: z.string(),
});

// Invite Management Schemas
export const GetInviteSettingsSchema = z.object({
  clubId: z.string(),
});

export const UpdateInviteSettingsSchema = z.object({
  clubId: z.string(),
  generateNew: z.boolean().optional(),
  maxMembers: z.number().positive().optional(),
  inviteExpiry: z.date().optional(),
  allowMemberInvites: z.boolean().optional(),
});

// Admin Messaging Schemas
export const SendAdminMessageSchema = z.object({
  clubId: z.string(),
  message: z.string().min(1).max(500),
  type: AdminMessageTypeEnum.default("INFO"),
  targetUserIds: z.array(z.string()).optional(),
});

export const GetAdminMessagesSchema = z.object({
  clubId: z.string(),
  limit: z.number().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export const AdminMessageSchema = z.object({
  id: z.string(),
  message: z.string(),
  type: AdminMessageTypeEnum,
  targetUserIds: z.array(z.string()),
  isRead: z.boolean(),
  clubId: z.string(),
  senderId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Club Ban Schemas
export const ClubBanSchema = z.object({
  id: z.string(),
  reason: z.string().optional(),
  isPermanent: z.boolean(),
  expiresAt: z.date().optional(),
  userId: z.string(),
  clubId: z.string(),
  bannedById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Club Analytics Schemas
export const GetClubAnalyticsSchema = z.object({
  clubId: z.string(),
  timeRange: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
});

export const ClubAnalyticsSchema = z.object({
  memberGrowth: z.array(z.object({
    joinedAt: z.date(),
    _count: z.number(),
  })),
  activityMetrics: z.array(z.object({
    timestamp: z.date(),
    _count: z.number(),
  })),
  currentStats: z.object({
    members: z.number(),
    challenges: z.number(),
    events: z.number(),
    posts: z.number(),
    joinRequests: z.number(),
  }),
  topMembers: z.array(z.any()), // Can be enhanced later
});

// Invite Settings Schema
export const InviteSettingsSchema = z.object({
  inviteCode: z.string().optional(),
  isPrivate: z.boolean(),
  maxMembers: z.number().optional(),
  inviteExpiry: z.date().optional(),
  allowMemberInvites: z.boolean(),
  inviteUsageCount: z.number(),
});

// Enhanced Club Member Management
export const EnhancedClubMemberSchema = z.object({
  id: z.string(),
  role: ClubRoleEnum,
  joinedAt: z.date(),
  userId: z.string(),
  clubId: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string().optional(),
    email: z.string(),
    imageUrl: z.string().optional(),
  }),
  isBanned: z.boolean().default(false),
  banInfo: ClubBanSchema.optional(),
});

// Member management search and filter
export const SearchMembersSchema = z.object({
  clubId: z.string(),
  query: z.string().optional(),
  role: ClubRoleEnum.optional(),
  sortBy: z.enum(["name", "joinedAt", "role", "activity"]).default("joinedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

// Bulk action results
export const BulkActionResultSchema = z.object({
  results: z.array(z.object({
    userId: z.string(),
    success: z.boolean(),
    error: z.string().optional(),
  })),
});

// Enhanced Join Request Schema
export const EnhancedJoinRequestSchema = z.object({
  id: z.string(),
  status: ClubJoinRequestStatusEnum,
  message: z.string().optional(),
  userId: z.string(),
  clubId: z.string(),
  reviewedById: z.string().optional(),
  reviewedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  user: z.object({
    id: z.string(),
    name: z.string().optional(),
    email: z.string(),
    imageUrl: z.string().optional(),
  }),
});

// Admin Dashboard Summary
export const AdminDashboardSummarySchema = z.object({
  pendingJoinRequests: z.number(),
  totalMembers: z.number(),
  recentActivity: z.number(),
  bannedMembers: z.number(),
  unreadMessages: z.number(),
  activeChallenges: z.number(),
  upcomingEvents: z.number(),
});

export type AdminMessageType = z.infer<typeof AdminMessageTypeEnum>;
export type BanMember = z.infer<typeof BanMemberSchema>;
export type UnbanMember = z.infer<typeof UnbanMemberSchema>;
export type BulkMemberActions = z.infer<typeof BulkMemberActionsSchema>;
export type GetBannedMembers = z.infer<typeof GetBannedMembersSchema>;
export type GetInviteSettings = z.infer<typeof GetInviteSettingsSchema>;
export type UpdateInviteSettings = z.infer<typeof UpdateInviteSettingsSchema>;
export type SendAdminMessage = z.infer<typeof SendAdminMessageSchema>;
export type GetAdminMessages = z.infer<typeof GetAdminMessagesSchema>;
export type AdminMessage = z.infer<typeof AdminMessageSchema>;
export type ClubBan = z.infer<typeof ClubBanSchema>;
export type GetClubAnalytics = z.infer<typeof GetClubAnalyticsSchema>;
export type ClubAnalytics = z.infer<typeof ClubAnalyticsSchema>;
export type InviteSettings = z.infer<typeof InviteSettingsSchema>;
export type EnhancedClubMember = z.infer<typeof EnhancedClubMemberSchema>;
export type SearchMembers = z.infer<typeof SearchMembersSchema>;
export type BulkActionResult = z.infer<typeof BulkActionResultSchema>;
export type EnhancedJoinRequest = z.infer<typeof EnhancedJoinRequestSchema>;
export type AdminDashboardSummary = z.infer<typeof AdminDashboardSummarySchema>;

// Event System Types
export type EventStatus = z.infer<typeof EventStatusEnum>;
export type ChallengeStatus = z.infer<typeof ChallengeStatusEnum>;
export type EventChallenge = z.infer<typeof EventChallengeSchema>;
export type EventEntry = z.infer<typeof EventEntrySchema>;
export type ChallengeEntry = z.infer<typeof ChallengeEntrySchema>;
export type RegisterForEvent = z.infer<typeof RegisterForEventSchema>;
export type EnterChallenge = z.infer<typeof EnterChallengeSchema>;
export type CompleteChallenge = z.infer<typeof CompleteChallengeSchema>;
