import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IWebsiteAnalysis {
  companyId: mongoose.Types.ObjectId;
  url: string;
  title?: string;
  description?: string;
  content?: string;
  scrapedAt?: Date;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  retryCount: number;
  error?: string;
}

export interface IWebsiteAnalysisDocument extends IWebsiteAnalysis, Document {
  _id: mongoose.Types.ObjectId;
}

const websiteAnalysisSchema = new Schema<IWebsiteAnalysisDocument>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    url: { type: String, required: true, trim: true },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    content: { type: String },
    scrapedAt: { type: Date },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    retryCount: { type: Number, default: 0, min: 0 },
    error: { type: String, trim: true },
  },
  { timestamps: true },
);

websiteAnalysisSchema.index({ companyId: 1, createdAt: -1 });

export const WebsiteAnalysis: Model<IWebsiteAnalysisDocument> =
  mongoose.models.WebsiteAnalysis ??
  mongoose.model<IWebsiteAnalysisDocument>('WebsiteAnalysis', websiteAnalysisSchema);
