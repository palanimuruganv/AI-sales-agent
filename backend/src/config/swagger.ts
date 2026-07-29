import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { env } from './env.js';

const __dirname = path.dirname(__filename);

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'AI Sales Agent API',
      version: '1.0.0',
      description: 'Production API for B2B lead analysis and sales pipeline management',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Local development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(process.cwd(), 'src/routes/*.ts'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
