import { UserRepository } from './repositories/user.repository.js';
import { RefreshTokenRepository } from './repositories/refreshToken.repository.js';
import { CompanyRepository } from './repositories/company.repository.js';
import { AnalysisRepository } from './repositories/analysis.repository.js';
import { EmailRepository } from './repositories/email.repository.js';
import { AuthService } from './services/auth.service.js';
import { CompanyService } from './services/company.service.js';
import { AnalysisService } from './services/analysis.service.js';
import { EmailService } from './services/email.service.js';
import { CsvImportService } from './services/csvImport.service.js';
import { AuthController } from './controllers/auth.controller.js';
import { HealthController } from './controllers/health.controller.js';
import { CompanyController } from './controllers/company.controller.js';
import { AnalysisController } from './controllers/analysis.controller.js';
import { EmailController } from './controllers/email.controller.js';
import { CsvImportController } from './controllers/csvImport.controller.js';

const userRepository = new UserRepository();
const refreshTokenRepository = new RefreshTokenRepository();
const companyRepository = new CompanyRepository();
const analysisRepository = new AnalysisRepository();
const emailRepository = new EmailRepository();

const authService = new AuthService(userRepository, refreshTokenRepository);
const companyService = new CompanyService(companyRepository);
const analysisService = new AnalysisService(analysisRepository, companyRepository);
const emailService = new EmailService(emailRepository, companyRepository);
const csvImportService = new CsvImportService(companyRepository);

export const authController = new AuthController(authService);
export const healthController = new HealthController();
export const companyController = new CompanyController(companyService);
export const analysisController = new AnalysisController(analysisService);
export const emailController = new EmailController(emailService);
export const csvImportController = new CsvImportController(csvImportService);

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
    csvImportService,
  },
  controllers: {
    authController,
    healthController,
    companyController,
    analysisController,
    emailController,
    csvImportController,
  },
};
