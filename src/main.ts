import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Allow the configured production frontend and local Vite servers.
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      process.env.FRONTEND_URL || 'https://noovacor.com',
      'https://noovacor.com',
      'https://www.noovacor.com',
      'https://noovacor-frontend.vercel.app',
    ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
  allowedHeaders: 'Content-Type, Accept, Authorization',
});

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Noovacor API')
    .setDescription('Backend API Documentation for Noovacor System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  const uploadPath = join(process.cwd(), 'uploads');

  if (!existsSync(uploadPath)) {
    mkdirSync(uploadPath, { recursive: true });
  }

  app.useStaticAssets(uploadPath, {
    prefix: '/uploads',
  });



  await app.listen(process.env.PORT ?? 3000);

  console.log(`🚀 Server Running: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`📚 Swagger Docs: http://localhost:${process.env.PORT ?? 3000}/api`);
}

bootstrap();