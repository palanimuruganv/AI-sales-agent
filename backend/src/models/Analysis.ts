import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { AnalysisPriority } from '../types/index.js';

export interface IAnalysis {
  companyId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  businessProblems: string[];
  softwareOpportunities: string[];
  websiteAudit?: string;
  aiSummary?: string;
  priority: AnalysisPriority;
  confidence?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAnalysisDocument extends IAnalysis, Document {
  _id: mongoose.Types.ObjectId;
}

const analysisSchema = new Schema<IAnalysisDocument>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    businessProblems: { type: [String], default: [] },
    softwareOpportunities: { type: [String], default: [] },
    websiteAudit: { type: String },
    aiSummary: { type: String },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    confidence: { type: Number, min: 0, max: 1 },
  },
  { timestamps: true },
);

analysisSchema.index({ companyId: 1, ownerId: 1 }, { unique: true });

export const Analysis: Model<IAnalysisDocument> =
  mongoose.models.Analysis ?? mongoose.model<IAnalysisDocument>('Analysis', analysisSchema);
