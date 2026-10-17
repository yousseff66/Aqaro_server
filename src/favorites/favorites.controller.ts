import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ObjectIdValidationPipe } from '../common/pipes/object-id-validation.pipe';

import { FavoritesService } from './favorites.service';

type AuthenticatedRequest = ExpressRequest & {
  user: {
    userId: string;
  };
};

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':propertyId')
  add(
    @Param('propertyId', ObjectIdValidationPipe)
    propertyId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.favoritesService.add(req.user.userId, propertyId);
  }

  @Delete(':propertyId')
  remove(
    @Param('propertyId', ObjectIdValidationPipe)
    propertyId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.favoritesService.remove(req.user.userId, propertyId);
  }
  @Get('count')
  count(@Request() req: AuthenticatedRequest) {
    return this.favoritesService.count(req.user.userId);
  }
  @Get('is-favorite/:propertyId')
  isFavorite(
    @Param('propertyId', ObjectIdValidationPipe)
    propertyId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.favoritesService.isFavorite(req.user.userId, propertyId);
  }

  @Get()
  findMyFavorites(@Request() req: AuthenticatedRequest) {
    return this.favoritesService.findMyFavorites(req.user.userId);
  }
}
