import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ReviewsService } from './reviews.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { Roles } from '../auth/decorators/roles.decorator';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

interface CurrentUserPayload {
  userId: string;
  email: string;
  role: string;
}

@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
  ) {}

  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Post()
  create(
    @Body()
    dto: CreateReviewDto,

    @CurrentUser()
    user: CurrentUserPayload,
  ) {
    return this.reviewsService.create(
      dto,
      user.userId,
    );
  }

  @Get('user/:id')
  getUserReviews(
    @Param('id')
    id: string,
  ) {
    return this.reviewsService.getUserReviews(
      id,
    );
  }

  @Get('user/:id/rating')
  getAverageRating(
    @Param('id')
    id: string,
  ) {
    return this.reviewsService.getAverageRating(
      id,
    );
  }

  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Patch(':id')
  update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateReviewDto,

    @CurrentUser()
    user: CurrentUserPayload,
  ) {
    return this.reviewsService.update(
      id,
      dto,
      user.userId,
    );
  }

  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Delete(':id')
  remove(
    @Param('id')
    id: string,

    @CurrentUser()
    user: CurrentUserPayload,
  ) {
    return this.reviewsService.remove(
      id,
      user.userId,
    );
  }

  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('Admin')
  @Delete('admin/:id')
  adminDelete(
    @Param('id')
    id: string,
  ) {
    return this.reviewsService.adminDelete(
      id,
    );
  }
}