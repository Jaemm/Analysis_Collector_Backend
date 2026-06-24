import { AuthService } from './auth.service';
import * as jwt from 'jsonwebtoken';
import { ErrorCodes } from '../exceptions/error-codes';

describe('AuthService', () => {
  const logger = {
    warn: jest.fn(),
  };

  let service: AuthService;
  const envBackup = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...envBackup };
    service = new AuthService(logger as any);
  });

  afterAll(() => {
    process.env = envBackup;
  });

  describe('getTokenFromRequest', () => {
    it('normalizes duplicated bearer prefixes', () => {
      const request = {
        headers: {
          authorization: 'Bearer Bearer ey.header.payload',
        },
      };

      expect(service.getTokenFromRequest(request as any)).toBe(
        'ey.header.payload',
      );
    });

    it('normalizes custom chowis token headers', () => {
      const request = {
        headers: {
          'x-chowis-token': '"Bearer ey.header.payload"',
        },
      };

      expect(service.getTokenFromRequest(request as any)).toBe(
        'ey.header.payload',
      );
    });

    it('prefers consultant token header over fallback headers', () => {
      const request = {
        headers: {
          'x-chowis-consultant-token': 'Bearer consultant-token',
          'x-chowis-token': 'Bearer chowis-token',
          authorization: 'Bearer auth-token',
        },
      };

      expect(service.getTokenFromRequest(request as any)).toBe(
        'consultant-token',
      );
    });
  });

  describe('issueStagingMasterToken', () => {
    it('issues a signed staging master token when explicitly enabled', () => {
      process.env.STAGING_MASTER_TOKEN_ENABLED = 'true';
      process.env.JWT_SECRET = 'test-secret';

      const result = service.issueStagingMasterToken();
      const payload = jwt.verify(result.access_token, 'test-secret') as any;

      expect(result).toMatchObject({
        token_type: 'Bearer',
        expires_in: 604800,
        consultant_id: '0',
        consultant_email: 'staging-master@chowis.com',
        app_id: '0',
        is_master: true,
      });
      expect(payload).toMatchObject({
        sub: '0',
        email: 'staging-master@chowis.com',
        app_id: '0',
        role: 'master',
        is_master: true,
      });
    });

    it('rejects staging master token issue outside staging mode', () => {
      process.env.JWT_SECRET = 'test-secret';
      delete process.env.STAGING_MASTER_TOKEN_ENABLED;
      delete process.env.APP_ENV;
      process.env.NODE_ENV = 'production';

      try {
        service.issueStagingMasterToken();
        fail('Expected issueStagingMasterToken to throw.');
      } catch (error: any) {
        expect(error.getStatus()).toBe(403);
        expect(error.getResponse()).toEqual({
          success: false,
          error: {
            code: ErrorCodes.AUTH_STAGING_ONLY,
            message: 'This API is only available in staging.',
          },
        });
      }
    });
  });

  describe('verifyToken', () => {
    it('verifies a valid JWT with the configured secret', () => {
      process.env.JWT_SECRET = 'test-secret';
      const token = jwt.sign({ sub: '123', app_id: 'app-1' }, 'test-secret');

      expect(service.verifyToken(token)).toMatchObject({
        sub: '123',
        app_id: 'app-1',
      });
    });

    it('logs and throws a normalized error for invalid JWTs', () => {
      process.env.JWT_SECRET = 'test-secret';

      try {
        service.verifyToken('invalid-token');
        fail('Expected verifyToken to throw.');
      } catch (error: any) {
        expect(error.getStatus()).toBe(401);
        expect(error.getResponse()).toEqual({
          success: false,
          error: {
            code: ErrorCodes.AUTH_TOKEN_INVALID,
            message: 'Invalid token.',
          },
        });
      }
      expect(logger.warn).toHaveBeenCalledWith(
        'JWT verification failed',
        expect.objectContaining({
          reason: expect.any(String),
          secretSource: 'JWT_SECRET',
        }),
      );
    });
  });
});
