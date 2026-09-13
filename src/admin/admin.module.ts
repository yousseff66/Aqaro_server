import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { PropertiesModule } from '../properties/properties.module';
import { UsersModule } from '../users/users.module';
import { FavoritesModule } from '../favorites/favorites.module';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';
import { PaymentsModule } from '../payments/payments.module';
import { ReportsModule } from '../reports/reports.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SupportModule } from '../support/support.module';

@Module({
  imports: [
    PropertiesModule,
    UsersModule,
    FavoritesModule,
    PlatformSettingsModule,
    PaymentsModule,
    ReportsModule,
    NotificationsModule,
    SupportModule,
  ],
  controllers: [AdminController],
})
export class AdminModule {}