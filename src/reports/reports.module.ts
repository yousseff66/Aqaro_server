import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Report, ReportSchema } from './schemas/report.schema';

import {
  Property,
  PropertySchema,
} from '../properties/schemas/property.schema';

import { User, UserSchema } from '../users/schemas/user.schema';

import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

import { PropertiesModule } from '../properties/properties.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Report.name,
        schema: ReportSchema,
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

    PropertiesModule,
  ],

  controllers: [ReportsController],

  providers: [ReportsService],

  exports: [ReportsService],
})
export class ReportsModule {}
