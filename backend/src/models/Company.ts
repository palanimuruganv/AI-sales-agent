import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { CompanyStatus } from '../types/index.js';

export interface ICompany {
  ownerId: mongoose.Types.ObjectId;
  companyName: string;
  website?: string;
  industry?: string;
  employees?: number;
  country?: string;
  linkedin?: string;
  email?: string;
  phone?: string;
  status: CompanyStatus;
  leadScore?: number;
  createdAt: Date;
}

export interface ICompanyDocument extends ICompany, Document {
  _id: mongoose.Types.ObjectId;
}

const companySchema = new Schema<ICompanyDocument>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    companyName: { type: String, required: true, trim: true },
    website: { type: String, trim: true },
    industry: { type: String, trim: true },
    employees: { type: Number, min: 0 },
    country: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    status: {
      type: String,
      enum: ['new', 'analyzed', 'contacted', 'qualified', 'won', 'lost'],
      default: 'new',
    },
    leadScore: { type: Number, min: 0, max: 100 },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

companySchema.index({ ownerId: 1, companyName: 1 });

export const Company: Model<ICompanyDocument> =
  mongoose.models.Company ?? mongoose.model<ICompanyDocument>('Company', companySchema);
