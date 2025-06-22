import { z } from "zod";
import { TRPCError } from "@trpc/server";

// ==================== SECURITY VALIDATION PATTERNS ====================

// Safe string patterns
const SAFE_TEXT_PATTERN = /^[a-zA-Z0-9\s\-_.,'":;!?()[\]{}@#$%&*+=<>/\\]*$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,30}$/;
const SLUG_PATTERN = /^[a-z0-9-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d\s\-()]{10,20}$/;
const URL_PATTERN = /^https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w/_.])*)?(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?$/;

// Vehicle specific patterns
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;
const LICENSE_PLATE_PATTERN = /^[A-Z0-9\s-]{2,15}$/i;

// ==================== BASE VALIDATION SCHEMAS ====================

export const SecurityValidation = {
  // Safe text with XSS protection
  safeText: (minLength = 1, maxLength = 1000) =>
    z.string()
      .min(minLength, `Text must be at least ${minLength} characters`)
      .max(maxLength, `Text must be no more than ${maxLength} characters`)
      .regex(SAFE_TEXT_PATTERN, "Text contains invalid characters")
      .transform((val) => sanitizeHtml(val)),

  // Rich text content (allows some HTML)
  richText: (maxLength = 10000) =>
    z.string()
      .max(maxLength, `Content must be no more than ${maxLength} characters`)
      .transform((val) => sanitizeRichText(val)),

  // Username validation
  username: () =>
    z.string()
      .regex(USERNAME_PATTERN, "Username must be 3-30 characters, letters, numbers, underscore, or dash only")
      .transform((val) => val.toLowerCase()),

  // URL validation
  url: (required = false) => {
    const schema = z.string().regex(URL_PATTERN, "Invalid URL format");
    return required ? schema : schema.optional();
  },

  // Email validation
  email: () =>
    z.string()
      .regex(EMAIL_PATTERN, "Invalid email format")
      .max(254, "Email too long")
      .transform((val) => val.toLowerCase().trim()),

  // Phone validation
  phone: () =>
    z.string()
      .regex(PHONE_PATTERN, "Invalid phone number format")
      .transform((val) => val.replace(/\s/g, "")),

  // Slug validation (for URLs)
  slug: () =>
    z.string()
      .min(3, "Slug must be at least 3 characters")
      .max(50, "Slug must be no more than 50 characters")
      .regex(SLUG_PATTERN, "Slug can only contain lowercase letters, numbers, and dashes"),

  // Numeric validations
  positiveInt: (min = 1, max = Number.MAX_SAFE_INTEGER) =>
    z.number().int().min(min).max(max),

  // Geographic coordinates
  latitude: () => z.number().min(-90).max(90),
  longitude: () => z.number().min(-180).max(180),

  // File upload validation
  fileUpload: () =>
    z.object({
      filename: z.string().min(1).max(255),
      mimetype: z.enum([
        "image/jpeg", "image/png", "image/webp", "image/gif",
        "application/pdf", "text/plain"
      ]),
      size: z.number().max(10 * 1024 * 1024), // 10MB max
    }),
};

// ==================== AUTOMOTIVE SPECIFIC VALIDATIONS ====================

export const AutomotiveValidation = {
  // VIN number validation
  vin: () =>
    z.string()
      .length(17, "VIN must be exactly 17 characters")
      .regex(VIN_PATTERN, "Invalid VIN format")
      .transform((val) => val.toUpperCase()),

  // License plate validation
  licensePlate: () =>
    z.string()
      .min(2, "License plate too short")
      .max(15, "License plate too long")
      .regex(LICENSE_PLATE_PATTERN, "Invalid license plate format")
      .transform((val) => val.toUpperCase()),

  // Vehicle year validation
  year: () =>
    z.number()
      .int()
      .min(1900, "Year too old")
      .max(new Date().getFullYear() + 1, "Year cannot be in the future"),

  // Mileage validation
  mileage: () =>
    z.number()
      .int()
      .min(0, "Mileage cannot be negative")
      .max(1000000, "Mileage seems unrealistic"),

  // Engine displacement
  engineSize: () =>
    z.number()
      .positive("Engine size must be positive")
      .max(20, "Engine size seems unrealistic"),

  // Fuel efficiency
  mpg: () =>
    z.number()
      .positive("MPG must be positive")
      .max(300, "MPG seems unrealistic"),
};

// ==================== CONTENT VALIDATION SCHEMAS ====================

export const ContentValidationSchemas = {
  // User profile validation
  userProfile: z.object({
    name: SecurityValidation.safeText(2, 100),
    bio: SecurityValidation.richText(500).optional(),
    location: SecurityValidation.safeText(3, 100).optional(),
    website: SecurityValidation.url().optional(),
    phone: SecurityValidation.phone().optional(),
  }),

  // Club creation/update validation
  club: z.object({
    name: SecurityValidation.safeText(3, 100),
    description: SecurityValidation.richText(2000).optional(),
    city: SecurityValidation.safeText(2, 100).optional(),
    territory: SecurityValidation.safeText(2, 100).optional(),
    isPrivate: z.boolean(),
    imageUrl: SecurityValidation.url().optional(),
    latitude: SecurityValidation.latitude().optional(),
    longitude: SecurityValidation.longitude().optional(),
  }),

  // Post creation validation
  post: z.object({
    content: SecurityValidation.richText(5000),
    clubId: z.string().uuid("Invalid club ID"),
    images: z.array(SecurityValidation.url()).max(10, "Too many images").optional(),
    tags: z.array(SecurityValidation.safeText(1, 50)).max(10, "Too many tags").optional(),
  }),

  // Event creation validation
  event: z.object({
    title: SecurityValidation.safeText(5, 200),
    description: SecurityValidation.richText(2000),
    date: z.date().min(new Date(), "Event date cannot be in the past"),
    location: SecurityValidation.safeText(3, 200).optional(),
    latitude: SecurityValidation.latitude().optional(),
    longitude: SecurityValidation.longitude().optional(),
    maxAttendees: SecurityValidation.positiveInt(1, 10000).optional(),
    clubId: z.string().uuid("Invalid club ID"),
  }),

  // Challenge creation validation
  challenge: z.object({
    title: SecurityValidation.safeText(5, 200),
    description: SecurityValidation.richText(2000),
    type: z.enum(["TIME_TRIAL", "DISTANCE", "FUEL_EFFICIENCY", "PHOTO_CONTEST", "CUSTOM"]),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD", "EXPERT"]),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    parameters: z.record(z.any()).optional(),
    clubId: z.string().uuid("Invalid club ID").optional(),
  }),

  // Car registration validation
  car: z.object({
    make: SecurityValidation.safeText(2, 50),
    model: SecurityValidation.safeText(2, 50),
    year: AutomotiveValidation.year(),
    vin: AutomotiveValidation.vin().optional(),
    color: SecurityValidation.safeText(3, 30).optional(),
    mileage: AutomotiveValidation.mileage().optional(),
    description: SecurityValidation.richText(1000).optional(),
  }),

  // Search validation
  search: z.object({
    query: SecurityValidation.safeText(1, 100),
    type: z.enum(["clubs", "users", "posts", "events", "challenges", "cars"]).optional(),
    location: SecurityValidation.safeText(2, 100).optional(),
    limit: SecurityValidation.positiveInt(1, 100).default(20),
    offset: SecurityValidation.positiveInt(0).default(0),
  }),

  // Comment validation
  comment: z.object({
    content: SecurityValidation.safeText(1, 2000),
    postId: z.string().uuid("Invalid post ID"),
  }),
};

// ==================== SANITIZATION FUNCTIONS ====================

function sanitizeHtml(input: string): string {
  // Basic HTML sanitization - remove script tags and other dangerous content
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

function sanitizeRichText(input: string): string {
  // Allow basic formatting tags but remove dangerous ones
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>.*?<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

// ==================== VALIDATION MIDDLEWARE ====================

export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (input: unknown): T => {
    try {
      return schema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Validation error: ${messages}`,
        });
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Validation failed",
      });
    }
  };
}

// ==================== SPECIALIZED VALIDATORS ====================

export class SecurityValidator {
  // Check for common SQL injection patterns
  static validateNoSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(--|\/\*|\*\/|;|'|"|`)/,
      /(\bOR\b|\bAND\b)\s*\d+\s*=\s*\d+/i,
    ];
    
    return !sqlPatterns.some(pattern => pattern.test(input));
  }

  // Check for XSS patterns
  static validateNoXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
    ];
    
    return !xssPatterns.some(pattern => pattern.test(input));
  }

  // Check for path traversal attempts
  static validateNoPathTraversal(input: string): boolean {
    const pathPatterns = [
      /\.\.\//g,
      /\.\.[\\/]/g,
      /%2e%2e%2f/gi,
      /%2e%2e%5c/gi,
    ];
    
    return !pathPatterns.some(pattern => pattern.test(input));
  }

  // Validate image URLs
  static validateImageUrl(url: string): boolean {
    console.log("🔍 SecurityValidator.validateImageUrl called with:", url);
    
    if (!url || typeof url !== 'string') {
      console.log("❌ URL validation failed: not a string or empty");
      return false;
    }
    
    // Must be a valid URL format
    if (!URL_PATTERN.test(url)) {
      console.log("❌ URL validation failed: doesn't match URL pattern");
      return false;
    }
    
    // Check for XSS in URL
    if (!SecurityValidator.validateNoXSS(url)) {
      console.log("❌ URL validation failed: XSS check failed");
      return false;
    }
    
    // Must be HTTPS for security
    if (!url.startsWith('https://')) {
      console.log("❌ URL validation failed: not HTTPS");
      return false;
    }
    
    // Check allowed domains (customize for your needs)
    const allowedDomains = [
      'amazonaws.com',
      'cloudfront.net',
      'imgur.com',
      'gravatar.com',
      'googleusercontent.com',
      'unsplash.com',
      'pexels.com',
      'utfs.io',  // UploadThing domain
      'ufs.sh',   // UploadThing domain (actual)
    ];
    
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      console.log("🔍 URL domain:", domain);
      
      // Allow if domain or any subdomain is in allowed list
      const isAllowedDomain = allowedDomains.some(allowedDomain => 
        domain === allowedDomain || domain.endsWith(`.${allowedDomain}`)
      );
      
      console.log("🔍 Is allowed domain?", isAllowedDomain);
      if (!isAllowedDomain) {
        console.log("❌ URL validation failed: domain not in allowed list");
        return false;
      }
      
      // Check file extension (skip for UploadThing URLs as they use content-addressed storage)
      const pathname = urlObj.pathname.toLowerCase();
      console.log("🔍 URL pathname:", pathname);
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      const hasImageExtension = imageExtensions.some(ext => pathname.endsWith(ext));
      const isUploadThingUrl = domain.endsWith('.ufs.sh') || domain.endsWith('.utfs.io');
      
      console.log("🔍 Has image extension?", hasImageExtension);
      console.log("🔍 Is UploadThing URL?", isUploadThingUrl);
      
      if (!hasImageExtension && !isUploadThingUrl) {
        console.log("❌ URL validation failed: no valid image extension and not UploadThing");
        return false;
      }
      
      console.log("✅ URL validation passed");
      return true;
    } catch (error) {
      console.log("❌ URL validation failed: error parsing URL:", error);
      return false;
    }
  }

  // Validate location strings (city, territory, etc.)
  static validateLocation(location: string): boolean {
    if (!location || typeof location !== 'string') return false;
    
    // Basic length check
    if (location.length < 2 || location.length > 100) return false;
    
    // Check for XSS
    if (!SecurityValidator.validateNoXSS(location)) return false;
    
    // Check for SQL injection
    if (!SecurityValidator.validateNoSQLInjection(location)) return false;
    
    // Allow letters, numbers, spaces, common punctuation for locations
    const locationPattern = /^[a-zA-Z0-9\s\-'.,()]+$/;
    return locationPattern.test(location);
  }

  // Validate IDs (UUIDs, CUIDs, etc.)
  static validateId(id: string): boolean {
    if (!id || typeof id !== 'string') return false;
    
    // Basic length and character check (more permissive for actual IDs)
    if (id.length < 3 || id.length > 36) return false;
    
    // Check for basic injection patterns
    if (!SecurityValidator.validateNoSQLInjection(id)) return false;
    if (!SecurityValidator.validateNoXSS(id)) return false;
    
    // Allow alphanumeric characters, hyphens, and underscores (covers most ID formats)
    const generalIdPattern = /^[a-zA-Z0-9_-]+$/;
    
    return generalIdPattern.test(id);
  }

  // Validate invite codes
  static validateInviteCode(code: string): boolean {
    if (!code || typeof code !== 'string') return false;
    
    // Check for injection patterns
    if (!SecurityValidator.validateNoSQLInjection(code)) return false;
    if (!SecurityValidator.validateNoXSS(code)) return false;
    
    // Invite codes are 8 character hex strings (uppercase)
    const inviteCodePattern = /^[A-F0-9]{8}$/;
    return inviteCodePattern.test(code);
  }

  // Validate file upload security
  static validateFileUpload(file: { filename: string; mimetype: string; size: number }) {
    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt'];
    const extension = file.filename.toLowerCase().substring(file.filename.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(extension)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "File type not allowed",
      });
    }

    // Check MIME type matches extension
    const mimeTypeMap: Record<string, string[]> = {
      '.jpg': ['image/jpeg'],
      '.jpeg': ['image/jpeg'],
      '.png': ['image/png'],
      '.gif': ['image/gif'],
      '.webp': ['image/webp'],
      '.pdf': ['application/pdf'],
      '.txt': ['text/plain'],
    };
    
    const allowedMimeTypes = mimeTypeMap[extension] || [];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "File type does not match extension",
      });
    }

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "File too large",
      });
    }

    return true;
  }
}

// ==================== USAGE HELPERS ====================

export function validateAndSanitize<T>(schema: z.ZodSchema<T>, input: unknown): T {
  const validator = createValidationMiddleware(schema);
  return validator(input);
}

// Pre-built validation functions for common use cases
export const CommonValidators = {
  createClub: (input: unknown) => validateAndSanitize(ContentValidationSchemas.club, input),
  createPost: (input: unknown) => validateAndSanitize(ContentValidationSchemas.post, input),
  createEvent: (input: unknown) => validateAndSanitize(ContentValidationSchemas.event, input),
  createChallenge: (input: unknown) => validateAndSanitize(ContentValidationSchemas.challenge, input),
  updateProfile: (input: unknown) => validateAndSanitize(ContentValidationSchemas.userProfile, input),
  registerCar: (input: unknown) => validateAndSanitize(ContentValidationSchemas.car, input),
  search: (input: unknown) => validateAndSanitize(ContentValidationSchemas.search, input),
  comment: (input: unknown) => validateAndSanitize(ContentValidationSchemas.comment, input),
}; 