import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Property, PropertyDocument } from './schemas/property.schema';

import {
  Favorite,
  FavoriteDocument,
} from '../favorites/schemas/favorite.schema';

import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PropertyCleanupService {
  private readonly logger = new Logger(PropertyCleanupService.name);

  constructor(
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,

    @InjectModel(Favorite.name)
    private readonly favoriteModel: Model<FavoriteDocument>,

    private readonly cloudinaryService: CloudinaryService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron('0 9 * * *')
  async notifyExpiringProperties() {
    const today = new Date();

    const after3Days = new Date();
    after3Days.setDate(today.getDate() + 3);

    const start = new Date(after3Days);
    start.setHours(0, 0, 0, 0);

    const end = new Date(after3Days);
    end.setHours(23, 59, 59, 999);

    const properties = await this.propertyModel.find({
      status: 'Published',
      expiresAt: {
        $gte: start,
        $lte: end,
      },
      expiryReminderSentAt: null,
    });

    for (const property of properties) {
      await this.notificationsService.createNotification(
        property.owner.toString(),
        'Property Expiring Soon',
        'Your property will expire in 3 days. Renew it to keep it published.',
        'PropertyExpiring',
        property._id.toString(),
      );

      property.expiryReminderSentAt = new Date();

      await property.save();
    }
  }

  @Cron('0 1 * * *')
  async demoteExpiredFeaturedProperties() {
    const expiredFeatured = await this.propertyModel.find({
      listingType: 'Featured',
      featuredExpiresAt: { $lte: new Date() },
    });

    if (!expiredFeatured.length) {
      return;
    }

    for (const property of expiredFeatured) {
      try {
        property.listingType = 'Normal';
        property.featuredExpiresAt = null;
        property.featuredDuration = undefined;
        await property.save();

        await this.notificationsService.createNotification(
          property.owner.toString(),
          'Featured Period Ended',
          'Your featured listing period has ended and your property is now a standard listing.',
          'FeaturedExpired',
          property._id.toString(),
        );

        this.logger.log(
          `Demoted property ${property._id} from Featured to Normal`,
        );
      } catch (error: any) {
        this.logger.error(
          `Failed to demote property ${property._id}`,
          error.stack,
        );
      }
    }
  }

  @Cron('0 0 * * *')
  async deleteExpiredProperties() {
    const expiredProperties = await this.propertyModel.find({
      status: 'Published',
      expiresAt: {
        $lte: new Date(),
      },
    });

    if (!expiredProperties.length) {
      return;
    }

    for (const property of expiredProperties) {
      try {
        this.logger.log(`Deleting property ${property._id}`);

        property.status = 'Deleting';

        await property.save();

        await this.notificationsService.createNotification(
          property.owner.toString(),
          'Property Expired',
          'Your property has expired and has been removed from the platform.',
          'PropertyExpired',
          property._id.toString(),
        );

        this.logger.log(`Deleting ${property.imagePublicIds.length} images`);

        for (const publicId of property.imagePublicIds) {
          await this.cloudinaryService.deleteImage(publicId);
        }

        this.logger.log('Deleting favorites');

        await this.favoriteModel.deleteMany({
          property: property._id,
        });

        this.logger.log('Deleting property document');

        await this.propertyModel.findByIdAndDelete(property._id);

        this.logger.log(`Property ${property._id} deleted successfully`);
      } catch (error: any) {
        this.logger.error(
          `Failed to delete property ${property._id}`,
          error.stack,
        );
      }
    }
  }
}
