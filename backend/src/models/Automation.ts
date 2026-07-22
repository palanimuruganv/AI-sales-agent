import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { AutomationStatus } from '../types/index.js';

export interface IAutomation {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  status: AutomationStatus;
  lastRunAt?: Date;
  createdAt: Date;
}

export interface IAutomationDocument extends IAutomation, Document {
  _id: mongoose.Types.ObjectId;
}

const automationSchema = new Schema<IAutomationDocument>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ['idle', 'running', 'completed', 'failed'],
      default: 'idle',
    },
    lastRunAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

export const Automation: Model<IAutomationDocument> =
  mongoose.models.Automation ??
  mongoose.model<IAutomationDocument>('Automation', automationSchema);
