import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import { S3Service } from '../src/s3/s3.service';
import { RequestIdInterceptor } from '../src/common/interceptors/request-id.interceptor';
import { ContextInterceptor } from '../src/common/interceptors/context.interceptor';
import { AccessLogInterceptor } from '../src/common/interceptors/access-log.interceptor';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('AppModule (e2e)', () => {
  let app: INestApplication;
  const envBackup = { ...process.env };

  const database = {
    executeQuery: jest.fn(),
  };

  const s3 = {
    testConnection: jest.fn(),
  };

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';
    process.env.DB_HOST = 'localhost';
    process.env.DB_USER = 'test';
    process.env.DB_PASSWORD = 'test';
    process.env.DB_NAME = 'analysis_collector_test';
    process.env.AWS_BUCKET = 'test-bucket';
    process.env.AWS_REGION = 'ap-northeast-2';
    process.env.AWS_ACCESS_KEY = 'test-access-key';
    process.env.AWS_SECRET_KEY = 'test-secret-key';
    process.env.CDN_URL = 'https://cdn.example.com';
  });

  afterAll(() => {
    process.env = envBackup;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    database.executeQuery.mockResolvedValue([{ '?column?': 1 }]);
    s3.testConnection.mockResolvedValue({ success: true });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DatabaseService)
      .useValue(database)
      .overrideProvider(S3Service)
      .useValue(s3)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalInterceptors(
      app.get(RequestIdInterceptor),
      app.get(ContextInterceptor),
      app.get(AccessLogInterceptor),
      app.get(ResponseInterceptor),
    );
    app.useGlobalFilters(app.get(HttpExceptionFilter));
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/health (GET)', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .set('x-request-id', 'test-request-id')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          success: true,
          requestId: 'test-request-id',
          data: {
            status: 'ok',
            timestamp: expect.any(String),
          },
        });
      });
  });

  it('/api/health/db (GET)', async () => {
    await request(app.getHttpServer())
      .get('/api/health/db')
      .set('x-request-id', 'test-request-id')
      .expect(200)
      .expect(({ body }) => {
        expect(database.executeQuery).toHaveBeenCalledWith('SELECT 1');
        expect(body).toEqual({
          success: true,
          requestId: 'test-request-id',
          data: {
            database: 'ok',
          },
        });
      });
  });

  it('/api/health/ready (GET)', async () => {
    await request(app.getHttpServer())
      .get('/api/health/ready')
      .set('x-request-id', 'test-request-id')
      .expect(200)
      .expect(({ body }) => {
        expect(database.executeQuery).toHaveBeenCalledWith('SELECT 1');
        expect(s3.testConnection).toHaveBeenCalled();
        expect(body).toEqual({
          success: true,
          requestId: 'test-request-id',
          data: {
            status: 'ready',
          },
        });
      });
  });
});
