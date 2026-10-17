import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import { Review, ReviewDocument } from './schemas/review.schema';

import {
  Property,
  PropertyDocument,
} from '../properties/schemas/property.schema';

import { User, UserDocument } from '../users/schemas/user.schema';

import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,

    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateReviewDto, userId: string) {
    const property = await this.propertyModel.findById(dto.propertyId);

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.owner.toString() === userId) {
      throw new BadRequestException('You cannot review yourself');
    }

    const existing = await this.reviewModel.findOne({
      reviewer: new Types.ObjectId(userId),
      property: property._id,
    });

    if (existing) {
      throw new BadRequestException('You already reviewed this property');
    }

    const review = await this.reviewModel.create({
      reviewer: new Types.ObjectId(userId),

      reviewedUser: property.owner,

      property: property._id,

      rating: dto.rating,

      comment: dto.comment ?? '',
    });

    return review;
  }

  async getUserReviews(userId: string) {
    return this.reviewModel
      .find({
        reviewedUser: new Types.ObjectId(userId),
      })
      .populate('reviewer', 'name image')
      .sort({
        createdAt: -1,
      });
  }

  async getAverageRating(userId: string) {
    const result = await this.reviewModel.aggregate([
      {
        $match: {
          reviewedUser: new Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: null,

          average: {
            $avg: '$rating',
          },

          count: {
            $sum: 1,
          },
        },
      },
    ]);

    return {
      average: result[0]?.average ?? 0,

      count: result[0]?.count ?? 0,
    };
  }

  async update(id: string, dto: UpdateReviewDto, userId: string) {
    const review = await this.reviewModel.findById(id);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.reviewer.toString() !== userId) {
      throw new ForbiddenException('Not allowed');
    }

    Object.assign(review, dto);

    return review.save();
  }

  async remove(id: string, userId: string) {
    const review = await this.reviewModel.findById(id);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.reviewer.toString() !== userId) {
      throw new ForbiddenException('Not allowed');
    }

    await this.reviewModel.findByIdAndDelete(id);

    return {
      message: 'Review deleted successfully',
    };
  }

  async adminDelete(id: string) {
    const review = await this.reviewModel.findById(id);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.reviewModel.findByIdAndDelete(id);

    return {
      message: 'Review deleted successfully',
    };
  }

  async deleteUserReviews(userId: string) {
    await this.reviewModel.deleteMany({
      $or: [
        { reviewer: new Types.ObjectId(userId) },
        { reviewedUser: new Types.ObjectId(userId) },
      ],
    });
  }
}
