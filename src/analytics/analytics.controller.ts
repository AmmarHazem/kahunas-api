import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('coach/stats')
  async getCoachStats(@Request() req) {
    if (req.user.role !== UserRole.COACH) {
      throw new ForbiddenException('Only coaches can access coach statistics');
    }
    return this.analyticsService.getCoachStats(req.user.id);
  }

  @Get('client/progress')
  async getClientProgress(@Request() req) {
    return this.analyticsService.getClientProgress(req.user.id);
  }

  @Get('coaches/top')
  async getTopCoaches(@Query('limit') limit: number) {
    return this.analyticsService.getTopCoaches(limit);
  }
}
