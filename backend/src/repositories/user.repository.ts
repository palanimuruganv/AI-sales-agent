import { User, type IUserDocument } from '../models/User.js';
import { BaseRepository } from './base.repository.js';

export class UserRepository extends BaseRepository<IUserDocument> {
  constructor() {
    super(User);
  }

  findByEmail(email: string): Promise<IUserDocument | null> {
    return User.findOne({ email: email.toLowerCase() }).select('+password').exec();
  }

  findByEmailPublic(email: string): Promise<IUserDocument | null> {
    return User.findOne({ email: email.toLowerCase() }).exec();
  }

  findByIdWithPassword(id: string): Promise<IUserDocument | null> {
    return User.findById(id).select('+password').exec();
  }
}
