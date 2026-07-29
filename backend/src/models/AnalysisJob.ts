import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IAnalysisJob {
  companyId: mongoose.Types.ObjectId;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  retryCount: number;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface IAnalysisJobDocument extends IAnalysisJob, Document {
  _id: mongoose.Types.ObjectId;
}

const analysisJobSchema = new Schema<IAnalysisJobDocument>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    retryCount: { type: Number, default: 0, min: 0 },
    error: { type: String, trim: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const AnalysisJob: Model<IAnalysisJobDocument> =
  mongoose.models.AnalysisJob ?? mongoose.model<IAnalysisJobDocument>('AnalysisJob', analysisJobSchema);
