import type { UserRepository } from '../repositories/user.repository.js';
import type { RefreshTokenRepository } from '../repositories/refreshToken.repository.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiryDate,
} from '../utils/jwt.js';
import { ConflictError, UnauthorizedError } from '../utils/errors.js';
import type { IUserDocument } from '../models/User.js';
import type { UserRole } from '../types/index.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  private toSafeUser(user: IUserDocument): SafeUser {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  private async issueTokens(user: IUserDocument): Promise<AuthTokens> {
    const payload = { sub: user._id.toString(), email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await this.refreshTokenRepository.createForUser(
      user._id.toString(),
      refreshToken,
      getRefreshTokenExpiryDate(),
    );
    return { accessToken, refreshToken };
  }

  async register(input: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  }): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const existing = await this.userRepository.findByEmailPublic(input.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }
    const password = await hashPassword(input.password);
    const user = await this.userRepository.create({
      name: input.name,
      email: input.email,
      password,
      role: input.role ?? 'user',
    });
    const tokens = await this.issueTokens(user);
    return { user: this.toSafeUser(user), tokens };
  }

  async login(email: string, password: string): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }
    const valid = await comparePassword(password, user.password);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }
    const tokens = await this.issueTokens(user);
    return { user: this.toSafeUser(user), tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
    const stored = await this.refreshTokenRepository.findValidToken(payload.sub, refreshToken);
    if (!stored) {
      throw new UnauthorizedError('Refresh token revoked or expired');
    }
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    await this.refreshTokenRepository.revokeToken(payload.sub, refreshToken);
    return this.issueTokens(user);
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.refreshTokenRepository.revokeToken(userId, refreshToken);
  }

  async getProfile(userId: string): Promise<SafeUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    return this.toSafeUser(user);
  }
}
