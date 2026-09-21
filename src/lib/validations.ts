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

export const PostSchema = z.object({
  locationId: z.string().min(1, 'Location is required'),
  businessName: z.string().optional(),
  locationCity: z.string().optional(),
  topic: z.string().min(10, 'Topic must be at least 10 characters'),
  postType: z.enum(['UPDATE', 'OFFER', 'EVENT', 'PRODUCT']),
  tone: z.enum(['PROFESSIONAL', 'FRIENDLY', 'URGENT', 'CONCISE']),
  language: z.string().min(1, 'Language is required'),
  cta: z.enum(['BOOK', 'CALL', 'LEARN_MORE', 'ORDER', 'SIGN_UP', 'GET_OFFER', 'NONE']),
  content: z.string().optional(),
  // Without an explicit `status` key the default strip mode of z.object removed the
  // client's status field, so "Publish Post" silently created a DRAFT.
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
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
