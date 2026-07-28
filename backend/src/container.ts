import { UserRepository } from '../repositories/user.repository.ts';
import { RefreshTokenRepository } from '../repositories/refreshToken.repository.ts';
import { CompanyRepository } from '../repositories/company.repository.ts';
import { AnalysisRepository } from '../repositories/analysis.repository.ts';
import { EmailRepository } from '../repositories/email.repository.ts';
import { AuthService } from '../services/auth.service.ts';
import { CompanyService } from '../services/company.service.ts';
import { AnalysisService } from '../services/analysis.service.ts';
import { EmailService } from '../services/email.service.ts';
import { AuthController } from '../controllers/auth.controller.ts';
import { HealthController } from '../controllers/health.controller.ts';
import { CompanyController } from '../controllers/company.controller.ts';
import { AnalysisController } from '../controllers/analysis.controller.ts';
import { EmailController } from '../controllers/email.controller.ts';

const userRepository = new UserRepository();
const refreshTokenRepository = new RefreshTokenRepository();
const companyRepository = new CompanyRepository();
const analysisRepository = new AnalysisRepository();
const emailRepository = new EmailRepository();

const authService = new AuthService(userRepository, refreshTokenRepository);
const companyService = new CompanyService(companyRepository);
const analysisService = new AnalysisService(analysisRepository, companyRepository);
const emailService = new EmailService(emailRepository, companyRepository);

export const authController = new AuthController(authService);
export const healthController = new HealthController();
export const companyController = new CompanyController(companyService);
export const analysisController = new AnalysisController(analysisService);
export const emailController = new EmailController(emailService);

export const container = {
  repositories: {
    userRepository,
    refreshTokenRepository,
    companyRepository,
    analysisRepository,
    emailRepository,
  },
  services: {
    authService,
    companyService,
    analysisService,
    emailService,
  },
  controllers: {
    authController,
    healthController,
    companyController,
    analysisController,
    emailController,
  },
};
