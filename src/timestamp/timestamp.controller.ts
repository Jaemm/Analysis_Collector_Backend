import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiCommonErrorResponses } from '../common/decorators/api-error-response.decorator';
import { ApiSuccessResponse } from '../common/decorators/api-response.decorator';
import { Public } from '../common/decorators/public.decorator';
import { buildSuccessResponse } from '../common/response/response-format';
import {
  TimestampCreateResponseDto,
  TimestampDetailResponseDto,
  TimestampDto,
  TimestampListResponseDto,
} from './timestamp.dto';
import { TimestampService } from './timestamp.service';

@Public()
@ApiTags('timestamp')
@Controller('/timestamp')
export class TimestampController {
  constructor(private readonly service: TimestampService) {}

  @Post()
  @ApiOperation({ summary: 'Create offline timestamp' })
  @ApiBody({ type: TimestampDto })
  @ApiSuccessResponse(TimestampCreateResponseDto, 201)
  @ApiCommonErrorResponses()
  async create(@Body() dto: TimestampDto) {
    const saved = await this.service.create(dto);
    return buildSuccessResponse(saved, '데이터 저장 성공');
  }

  @Get()
  @ApiOperation({ summary: 'List offline timestamps' })
  @ApiSuccessResponse(TimestampListResponseDto)
  @ApiCommonErrorResponses()
  async list() {
    return buildSuccessResponse(await this.service.findAll());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get offline timestamp' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiSuccessResponse(TimestampDetailResponseDto)
  @ApiCommonErrorResponses()
  async get(@Param('id', ParseIntPipe) id: number) {
    return buildSuccessResponse(await this.service.findOne(id));
  }
}
