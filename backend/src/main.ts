import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve admin-uploaded images/documents at /uploads/*
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    setHeaders: (res) => {
      // Allow the web app (different origin) to embed/fetch these files.
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });

  // Access log with client-abort detection: shows when a request arrived,
  // how long it ran, whether the client hung up mid-flight (timeout on the
  // browser side) or the response completed, plus the CORS origin.
  app.use((req, res, next) => {
    const start = Date.now();
    let done = false;
    const finish = (state: string) => {
      if (done) return;
      done = true;
      console.log(
        `[ACCESS] ${new Date().toISOString()} ${req.method} ${req.originalUrl} -> ${state} in ${Date.now() - start}ms origin=${req.headers.origin ?? '-'} ua=${(req.headers['user-agent'] || '-').slice(0, 40)}`,
      );
    };
    res.on('finish', () => finish('finished'));
    res.on('close', () => finish(res.writableEnded ? 'closed' : 'CLIENT-ABORTED'));
    next();
  });

  // Accept origins with or without a scheme: a bare host (e.g. from a
  // hosting provider's service reference) is expanded to https:// and http://.
  const normalizedOrigins: string[] = [];
  for (const raw of (process.env.CORS_ORIGINS || '').split(',')) {
    const origin = raw.trim();
    if (!origin) continue;
    if (/^https?:\/\//i.test(origin)) {
      normalizedOrigins.push(origin);
    } else {
      normalizedOrigins.push(`https://${origin}`, `http://${origin}`);
    }
  }

  const corsAllowList = new Set(
    [
      ...normalizedOrigins,
      'http://localhost:8082',
      'http://127.0.0.1:8082',
      'http://localhost:3005',
      'http://127.0.0.1:3005',
    ].filter(Boolean),
  );

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || corsAllowList.has(origin)) {
        return callback(null, true);
      }
      // Also allow the hosting provider's own domains (e.g. *.onrender.com)
      // so the deployed frontend can reach the API without extra wiring.
      try {
        if (new URL(origin).hostname.endsWith('.onrender.com')) {
          return callback(null, true);
        }
      } catch {
        // Ignore malformed origins.
      }
      // Deny by omitting CORS headers rather than raising (browsers block it).
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['authorization', 'x-university-id', 'content-type', 'accept'],
  });

  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'metrics'],
  });

  app.useGlobalInterceptors(new ResponseInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('CampusOS API')
    .setDescription('The operating system for student life')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-University-ID', in: 'header' }, 'UniversityID')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`CampusOS API running on port ${port}`);
}
bootstrap();
