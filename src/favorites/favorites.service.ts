import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Favorite, FavoriteDocument } from './schemas/favorite.schema';

import {
  Property,
  PropertyDocument,
} from '../properties/schemas/property.schema';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(Favorite.name)
    private readonly favoriteModel: Model<FavoriteDocument>,

    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
  ) {}

  async add(userId: string, propertyId: string) {
    const property = await this.propertyModel.findById(propertyId);

    if (!property) {
      throw new BadRequestException('Property not found');
    }

    const exists = await this.favoriteModel.findOne({
      user: new Types.ObjectId(userId),
      property: new Types.ObjectId(propertyId),
    });

    if (exists) {
      throw new BadRequestException('Property already in favorites');
    }

    const favorite = await this.favoriteModel.create({
      user: new Types.ObjectId(userId),
      property: new Types.ObjectId(propertyId),
    });

    await this.propertyModel.findByIdAndUpdate(propertyId, {
      $inc: {
        favoritesCount: 1,
      },
    });

    return favorite;
  }

  async remove(userId: string, propertyId: string) {
    const deleted = await this.favoriteModel.findOneAndDelete({
      user: new Types.ObjectId(userId),
      property: new Types.ObjectId(propertyId),
    });

    if (!deleted) {
      throw new BadRequestException('Favorite not found');
    }

    await this.propertyModel.findByIdAndUpdate(propertyId, {
      $inc: {
        favoritesCount: -1,
      },
    });

    return {
      message: 'Removed from favorites',
    };
  }

  async findMyFavorites(userId: string) {
    const favorites = await this.favoriteModel
      .find({
        user: new Types.ObjectId(userId),
      })
      .populate({
        path: 'property',
        populate: {
          path: 'owner',
          select: 'name',
        },
      });

    return favorites.map((f) => f.property);
  }
  async count(userId: string) {
    const count = await this.favoriteModel.countDocuments({
      user: new Types.ObjectId(userId),
    });

    return {
      count,
    };
  }
  async isFavorite(userId: string, propertyId: string) {
    const favorite = await this.favoriteModel.findOne({
      user: new Types.ObjectId(userId),
      property: new Types.ObjectId(propertyId),
    });

    return {
      isFavorite: !!favorite,
    };
  }
  async deleteUserFavorites(userId: string) {
    return this.favoriteModel.deleteMany({
      user: new Types.ObjectId(userId),
    });
  }
  async deletePropertyFavorites(propertyId: string) {
    return this.favoriteModel.deleteMany({
      property: new Types.ObjectId(propertyId),
    });
  }
}
