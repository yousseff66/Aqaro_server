import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Payment,
  PaymentSchema,
} from './schemas/payment.schema';

import {
  Property,
  PropertySchema,
} from '../properties/schemas/property.schema';

import {
  User,
  UserSchema,
} from '../users/schemas/user.schema';

import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PropertiesModule } from '../properties/properties.module';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Payment.name,
        schema: PaymentSchema,
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
    CloudinaryModule,
    PropertiesModule,
    PlatformSettingsModule,
    NotificationsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}