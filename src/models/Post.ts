import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    locationId: {
      type: String,
      required: true,
    },
    businessName: {
      type: String,
      required: true,
    },
    locationCity: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    postType: {
      type: String,
      enum: ['UPDATE', 'OFFER', 'EVENT', 'PRODUCT'],
      required: true,
    },
    tone: {
      type: String,
      enum: ['PROFESSIONAL', 'FRIENDLY', 'URGENT', 'CONCISE'],
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    cta: {
      type: String,
      enum: ['BOOK', 'CALL', 'LEARN_MORE', 'ORDER', 'SIGN_UP', 'GET_OFFER', 'NONE'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED'],
      default: 'DRAFT',
      required: true,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for ownership queries
PostSchema.index({ userId: 1, status: 1 });

export default mongoose.models.Post || mongoose.model('Post', PostSchema);
