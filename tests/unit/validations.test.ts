import { describe, expect, it } from 'vitest';
import {
  CreatePostSchema,
  LocationSchema,
  LoginSchema,
  PostListQuerySchema,
  PostSchema,
  RegisterSchema,
  UpdatePostSchema,
} from '@/lib/validations';

const validPost = {
  locationId: '1',
  businessName: 'Elite Dental Care',
  locationCity: 'Dental City',
  topic: 'Announcing our new weekend opening hours',
  postType: 'UPDATE' as const,
  tone: 'FRIENDLY' as const,
  language: 'English',
     cta: 'BOOK' as const,
  content: 'We are now open on Saturdays too.',
  status: 'DRAFT' as const,
};

describe('RegisterSchema', () => {
  it('accepts a valid registration and keeps only the expected fields', () => {
    const parsed = RegisterSchema.parse({
      name: 'Asha Rao',
      email: 'asha@example.com',
      password: 'secret123',
      role: 'admin',
      passwordHash: 'injected',
    });

    expect(parsed).toEqual({
      name: 'Asha Rao',
      email: 'asha@example.com',
      password: 'secret123',
    });
    expect(parsed).not.toHaveProperty('role');
    expect(parsed).not.toHaveProperty('passwordHash');
  });

  it('rejects a name shorter than two characters', () => {
    const result = RegisterSchema.safeParse({
      name: 'A',
      email: 'asha@example.com',
      password: 'secret123',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Name must be at least 2 characters');
  });

  it('rejects a malformed email address', () => {
    const result = RegisterSchema.safeParse({
      name: 'Asha Rao',
      email: 'not-an-email',
      password: 'secret123',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Invalid email address');
  });

  it('rejects a password shorter than six characters', () => {
    const result = RegisterSchema.safeParse({
      name: 'Asha Rao',
      email: 'asha@example.com',
      password: '12345',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Password must be at least 6 characters');
  });
});

describe('LoginSchema', () => {
  it('accepts valid credentials', () => {
    expect(LoginSchema.parse({ email: 'asha@example.com', password: 'x' })).toEqual({
      email: 'asha@example.com',
      password: 'x',
    });
  });

  it('rejects an empty password', () => {
    const result = LoginSchema.safeParse({ email: 'asha@example.com', password: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Password is required');
  });

  it('rejects a malformed email address', () => {
    const result = LoginSchema.safeParse({ email: 'asha', password: 'secret123' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Invalid email address');
  });
});

describe('PostSchema', () => {
  it('defaults the status to DRAFT when the caller omits it', () => {
    const { status, ...withoutStatus } = validPost;
    void status;

    expect(PostSchema.parse(withoutStatus).status).toBe('DRAFT');
  });

  it('keeps an explicit PUBLISHED status', () => {
    expect(PostSchema.parse({ ...validPost, status: 'PUBLISHED' }).status).toBe('PUBLISHED');
  });

  it('strips server owned columns such as userId', () => {
    const parsed = PostSchema.parse({
      ...validPost,
      userId: '507f1f77bcf86cd799439011',
      _id: '507f1f77bcf86cd799439099',
    });

    expect(parsed).not.toHaveProperty('userId');
    expect(parsed).not.toHaveProperty('_id');
  });

  it.each(['BLOG', 'update', ''])('rejects the unsupported post type %s', (postType) => {
    expect(PostSchema.safeParse({ ...validPost, postType }).success).toBe(false);
  });

  it.each(['LOUD', 'professional', ''])('rejects the unsupported tone %s', (tone) => {
    expect(PostSchema.safeParse({ ...validPost, tone }).success).toBe(false);
  });

  it.each(['BUY_NOW', 'book', ''])('rejects the unsupported call to action %s', (cta) => {
    expect(PostSchema.safeParse({ ...validPost, cta }).success).toBe(false);
  });

  it('rejects a topic shorter than ten characters', () => {
    const result = PostSchema.safeParse({ ...validPost, topic: 'Too short' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Topic must be at least 10 characters');
  });

  it('rejects a missing location', () => {
    const result = PostSchema.safeParse({ ...validPost, locationId: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Location is required');
  });
});
