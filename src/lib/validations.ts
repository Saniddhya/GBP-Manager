import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const POST_TYPES = ['UPDATE', 'OFFER', 'EVENT', 'PRODUCT'] as const;
export const TONES = ['PROFESSIONAL', 'FRIENDLY', 'URGENT', 'CONCISE'] as const;
export const CTAS = ['BOOK', 'CALL', 'LEARN_MORE', 'ORDER', 'SIGN_UP', 'GET_OFFER', 'NONE'] as const;
export const POST_STATUSES = ['DRAFT', 'PUBLISHED'] as const;

export const PostSchema = z.object({
  locationId: z.string().min(1, 'Location is required'),
  businessName: z.string().optional(),
  locationCity: z.string().optional(),
  topic: z.string().min(10, 'Topic must be at least 10 characters'),
  postType: z.enum(POST_TYPES),
  tone: z.enum(TONES),
  language: z.string().min(1, 'Language is required'),
  cta: z.enum(CTAS),
  content: z.string().optional(),
  // Without an explicit `status` key the default strip mode of z.object removed the
  // client's status field, so "Publish Post" silently created a DRAFT.
  status: z.enum(POST_STATUSES).default('DRAFT'),
});

/**
 * Stricter schema for persisting a post. The fields below are required by the
 * Post model, so validating them here returns a friendly 400 (e.g.
 * "Business name is required") instead of a Mongoose 500.
 */
export const CreatePostSchema = PostSchema.extend({
  businessName: z.string().min(1, 'Business name is required'),
  locationCity: z.string().min(1, 'Location city is required'),
  content: z.string().min(1, 'Content is required'),
});

/**
 * Body accepted by `PATCH /api/posts/:id`.
 *
 * Every column is optional, but only the editable ones are listed. Because
 * `z.object` strips unknown keys by default, a request body can no longer smuggle
 * server-owned columns such as `userId` (cross-tenant takeover), `_id`,
 * `createdAt` or `publishedAt` into the `$set` of the update.
 */
export const UpdatePostSchema = PostSchema.partial().extend({
  businessName: z.string().min(1, 'Business name is required').optional(),
  locationCity: z.string().min(1, 'Location city is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  topic: z.string().min(10, 'Topic must be at least 10 characters').optional(),
});

export const LocationSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  address: z.string().min(1, 'Address is required'),
  category: z.string().min(1, 'Category is required'),
  city: z.string().min(1, 'City is required'),
  phone: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
});

/**
 * Query string contract for `GET /api/posts`. Rejecting unknown enum values with
 * a 400 keeps the Mongo query free of client supplied operators.
 */
export const PostListQuerySchema = z.object({
  search: z.string().trim().max(120, 'Search term is too long').optional().default(''),
  status: z.enum(['ALL', ...POST_STATUSES]).optional().default('ALL'),
  sort: z.enum(['newest', 'oldest']).optional().default('newest'),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;
export type PostListQueryInput = z.infer<typeof PostListQuerySchema>;

