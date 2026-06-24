import { AnalysisController } from './analysis.controller';

describe('AnalysisController', () => {
  const analysisService = {
    createBatch: jest.fn(),
    getUploadUrls: jest.fn(),
    confirmUpload: jest.fn(),
    getComment: jest.fn(),
    updateComment: jest.fn(),
    getFullResult: jest.fn(),
    deleteBatch: jest.fn(),
  };

  let controller: AnalysisController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AnalysisController(analysisService as any);
  });

  it('creates a batch with normalized auth and device values', async () => {
    analysisService.createBatch.mockResolvedValueOnce({
      batch_id: '10',
    });

    await expect(
      controller.start(
        {
          customer_id: '1001',
          device_id: ' device-001 ',
        },
        {
          user: {
            app_id: ' app-1 ',
            id: ' consultant-1 ',
            email: ' consultant@example.com ',
          },
        },
      ),
    ).resolves.toEqual({
      batch_id: '10',
    });

    expect(analysisService.createBatch).toHaveBeenCalledWith(
      '1001',
      'online',
      'app-1',
      'consultant-1',
      'consultant@example.com',
      'device-001',
    );
  });

  it('creates a quick analysis batch without a customer id', async () => {
    analysisService.createBatch.mockResolvedValueOnce({
      batch_id: '11',
    });

    await expect(
      controller.start(
        {
          analysis_type: 'quick',
          device_id: ' device-001 ',
        },
        {
          user: {
            app_id: ' app-1 ',
            id: ' consultant-1 ',
            email: ' consultant@example.com ',
          },
        },
      ),
    ).resolves.toEqual({
      batch_id: '11',
    });

    expect(analysisService.createBatch).toHaveBeenCalledWith(
      null,
      'quick',
      'app-1',
      'consultant-1',
      'consultant@example.com',
      'device-001',
    );
  });

  it('returns a soft delete fallback when the batch was not deleted', async () => {
    analysisService.deleteBatch.mockResolvedValueOnce(null);

    await expect(
      controller.deleteBatch('123', {
        user: {
          sub: 'consultant-1',
        },
      }),
    ).resolves.toEqual({
      batch_id: '123',
      deleted: false,
      deleted_at: null,
    });

    expect(analysisService.deleteBatch).toHaveBeenCalledWith(
      '123',
      'consultant-1',
    );
  });

  it('writes the legacy comment response for successful updates', async () => {
    analysisService.updateComment.mockResolvedValueOnce({
      batch_id: 123,
      analysis_comment: 'memo',
    });
    const response = createMockResponse();

    await controller.analysisComment(
      {
        batchId: 123,
        comment: 'memo',
      },
      response as any,
    );

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      success: true,
      message: 'Comment inserted',
      data: {
        service: 'analysis/comment',
        response: 'Comment inserted',
      },
    });
  });

  it('gets the legacy comment response for an existing batch', async () => {
    analysisService.getComment.mockResolvedValueOnce({
      batch_id: 123,
      analysis_comment: 'memo',
    });
    const response = createMockResponse();

    await controller.getAnalysisComment('123', response as any);

    expect(analysisService.getComment).toHaveBeenCalledWith('123');
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      success: true,
      message: 'Comment found',
      data: {
        service: 'analysis/comment',
        response: 'Comment found',
        result: {
          batchId: 123,
          comment: 'memo',
        },
      },
    });
  });

  it('returns 404 when a comment batch does not exist', async () => {
    analysisService.getComment.mockResolvedValueOnce(null);
    const response = createMockResponse();

    await controller.getAnalysisComment('123', response as any);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      message: 'Analysis batch not found.',
      error: 'batch_id 123 was not found.',
    });
  });
});

function createMockResponse() {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
  };

  response.status.mockReturnValue(response);
  return response;
}
