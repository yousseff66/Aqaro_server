import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { Property, PropertySchema } from './schemas/property.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PropertyCleanupService } from './property-cleanup.service';
import {
  Favorite,
  FavoriteSchema,
} from '../favorites/schemas/favorite.schema';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';
import { NotificationsModule } from '../notifications/notifications.module';@Module({
  imports: [
    MongooseModule.forFeature([
    {
      name: Property.name,
      schema: PropertySchema,
    },
    {
      name: Favorite.name,
      schema: FavoriteSchema,
    },
  ]),
  CloudinaryModule,
  PlatformSettingsModule,
  NotificationsModule,
],
  controllers: [PropertiesController],
  providers: [PropertiesService, PropertyCleanupService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
