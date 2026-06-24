import { HealthService } from './health.service';

describe('HealthService', () => {
  const database = {
    executeQuery: jest.fn(),
  };

  const s3 = {
    testConnection: jest.fn(),
  };

  let service: HealthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new HealthService(database as any, s3 as any);
  });

  it('returns API server status', async () => {
    await expect(service.checkServer()).resolves.toEqual({
      status: 'ok',
      timestamp: expect.any(Date),
    });
  });

  it('returns database ok when SELECT 1 succeeds', async () => {
    database.executeQuery.mockResolvedValueOnce([{ '?column?': 1 }]);

    await expect(service.checkDatabase()).resolves.toEqual({ database: 'ok' });
    expect(database.executeQuery).toHaveBeenCalledWith('SELECT 1');
  });

  it('returns database error when SELECT 1 fails', async () => {
    database.executeQuery.mockRejectedValueOnce(new Error('db down'));

    await expect(service.checkDatabase()).resolves.toEqual({
      database: 'error',
      message: 'db down',
    });
  });

  it('returns ready when database and S3 checks succeed', async () => {
    database.executeQuery.mockResolvedValueOnce([{ '?column?': 1 }]);
    s3.testConnection.mockResolvedValueOnce({ success: true });

    await expect(service.checkReady()).resolves.toEqual({ status: 'ready' });
  });

  it('returns not_ready when a dependency check fails', async () => {
    database.executeQuery.mockResolvedValueOnce([{ '?column?': 1 }]);
    s3.testConnection.mockRejectedValueOnce(new Error('s3 down'));

    await expect(service.checkReady()).resolves.toEqual({
      status: 'not_ready',
    });
  });
});
