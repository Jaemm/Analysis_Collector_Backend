import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { ApiSuccessResponse } from '../common/decorators/api-response.decorator';
import {
  HealthDatabaseDto,
  HealthReadyDto,
  HealthS3Dto,
  HealthStatusDto,
} from './health.dto';

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check API server status' })
  @ApiSuccessResponse(HealthStatusDto)
  async health() {
    return this.healthService.checkServer();
  }

  @Get('db')
  @ApiOperation({ summary: 'Check database connection' })
  @ApiSuccessResponse(HealthDatabaseDto)
  async database() {
    return this.healthService.checkDatabase();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Check database and S3 readiness' })
  @ApiSuccessResponse(HealthReadyDto)
  async ready() {
    return this.healthService.checkReady();
  }

  @Get('s3')
  @ApiOperation({ summary: 'Check S3 connection' })
  @ApiSuccessResponse(HealthS3Dto)
  async s3() {
    return this.healthService.checkS3();
  }
}
