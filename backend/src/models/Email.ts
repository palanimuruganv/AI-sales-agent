import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { EmailStatus } from '../types/index.js';

export interface IEmail {
  companyId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  subject: string;
  body: string;
  status: EmailStatus;
  createdAt: Date;
}

export interface IEmailDocument extends IEmail, Document {
  _id: mongoose.Types.ObjectId;
}

const emailSchema = new Schema<IEmailDocument>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sent', 'failed'],
      default: 'draft',
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

emailSchema.index({ ownerId: 1, companyId: 1 });

export const Email: Model<IEmailDocument> =
  mongoose.models.Email ?? mongoose.model<IEmailDocument>('Email', emailSchema);
