import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { ContextInterceptor } from './common/interceptors/context.interceptor';
import { AccessLogInterceptor } from './common/interceptors/access-log.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppLogger } from './common/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // DI 기반 logger 사용 (핵심)
  const logger = app.get(AppLogger);
  app.useLogger(logger);
  app.getHttpAdapter().getInstance().set('trust proxy', true);

  /*
   Global Interceptors
  */
  app.useGlobalInterceptors(
    app.get(RequestIdInterceptor),
    app.get(ContextInterceptor),
    app.get(AccessLogInterceptor),
    app.get(ResponseInterceptor),
  );
  /*
   Global Filters
  */
  app.useGlobalFilters(app.get(HttpExceptionFilter));

  /*
   Versioning
  */
  app.enableVersioning({
    type: VersioningType.URI,
  });

  /*
   CORS
  */
  app.enableCors();

  /*
   API prefix
  */
  app.setGlobalPrefix('api');

  /*
   Validation
  */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  /*
   Large JSON Payload
  */
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  /*
   Swagger
  */
  const swaggerEnabled = !['false', '0', 'off', 'no'].includes(
    String(process.env.SWAGGER_ENABLED).toLowerCase(),
  );

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Analysis Collector API')
      .setDescription(
        [
          'Analysis batch collection, offline sync, result download, and health check API.',
          '',
          'All normal JSON responses are wrapped as `{ success, requestId, data }` by the global response interceptor.',
        ].join('\n'),
      )
      .setVersion('1.0')
      .addTag(
        'analysis',
        'Single batch creation, upload URL issue, confirmation, comments, and delete',
      )
      .addTag('analysis-download', 'JSON and ZIP download endpoints')
      .addTag('analysis-web', 'Public web result endpoint')
      .addTag('admin-analysis', 'Admin-only batch maintenance')
      .addTag('timestamp', 'Offline timestamp collection')
      .addTag('staging-auth', 'Staging authentication helper')
      .addTag('health', 'Service dependency health checks')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        'bearer',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = Number(process.env.PORT) || 3000;
  const hostname = process.env.HOSTNAME || '0.0.0.0';
  const protocol = process.env.SSL === 'true' ? 'https' : 'http';

  await app.listen(port);

  logger.log(`Listening at ${protocol}://${hostname}:${port}`);
}

bootstrap();
