import crypto from 'crypto';
import { RefreshToken, type IRefreshTokenDocument } from '../models/RefreshToken.js';
import { BaseRepository } from './base.repository.js';
import mongoose from 'mongoose';

export class RefreshTokenRepository extends BaseRepository<IRefreshTokenDocument> {
  constructor() {
    super(RefreshToken);
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async createForUser(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<IRefreshTokenDocument> {
    return RefreshToken.create({
      userId: new mongoose.Types.ObjectId(userId),
      tokenHash: this.hashToken(token),
      expiresAt,
    });
  }

  findValidToken(userId: string, token: string): Promise<IRefreshTokenDocument | null> {
    return RefreshToken.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      tokenHash: this.hashToken(token),
      expiresAt: { $gt: new Date() },
    }).exec();
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await RefreshToken.deleteMany({ userId: new mongoose.Types.ObjectId(userId) }).exec();
  }

  async revokeToken(userId: string, token: string): Promise<void> {
    await RefreshToken.deleteOne({
      userId: new mongoose.Types.ObjectId(userId),
      tokenHash: this.hashToken(token),
    }).exec();
  }
}
