import type { AuthService } from '../services/auth.service.js';
import type { Request, Response } from 'express';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const result = await this.authService.login(email, password);
    res.json({ success: true, data: result });
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const tokens = await this.authService.refresh(req.body.refreshToken);
    res.json({ success: true, data: tokens });
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    await this.authService.logout(userId, req.body.refreshToken);
    res.json({ success: true, message: 'Logged out' });
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const user = await this.authService.getProfile(req.user!.id);
    res.json({ success: true, data: user });
  };
}
