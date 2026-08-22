import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import helmet from 'helmet';
import compression from 'compression';

import { AppModule } from './app.module';

import {
  SwaggerModule,
  DocumentBuilder,
} from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  app.use(compression());

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : true;

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Sakan API')
    .setDescription('Sakan Backend API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(
    app,
    config,
  );

  SwaggerModule.setup(
    'docs',
    app,
    document,
  );

  await app.listen(
    process.env.PORT ?? 3000,'0.0.0.0'
  );

  console.log(
    `🚀 Server: http://localhost:${process.env.PORT ?? 3000}`,
  );

  console.log(
    `📄 Swagger: http://localhost:${process.env.PORT ?? 3000}/docs`,
  );
}

void bootstrap();