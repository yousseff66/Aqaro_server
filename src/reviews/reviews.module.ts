import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Review,
  ReviewSchema,
} from './schemas/review.schema';

import {
  Property,
  PropertySchema,
} from '../properties/schemas/property.schema';

import {
  User,
  UserSchema,
} from '../users/schemas/user.schema';

import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Review.name,
        schema: ReviewSchema,
      },
      {
        name: Property.name,
        schema: PropertySchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  controllers: [
    ReviewsController,
  ],
  providers: [
    ReviewsService,
  ],
  exports: [
    ReviewsService,
  ],
})
export class ReviewsModule {}