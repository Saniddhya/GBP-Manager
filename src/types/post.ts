/**
 * Shape of a post document as consumed by the client components.
 *
 * Declared once because the form, the live preview and both detail pages render
 * the same record. The previous `any` props hid field-name typos from the
 * compiler (for example `post.businessNames`).
 */
export interface PostRecord {
  _id: string;
  locationId: string;
  businessName: string;
  locationCity: string;
  topic: string;
  postType: string;
  tone: string;
  language: string;
  cta: string;
  content: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Post handed to the form when editing an existing record. */
export type PostFormInitialData = Partial<PostRecord>;
