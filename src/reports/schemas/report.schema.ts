import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

import { User } from '../../users/schemas/user.schema';
import { Property } from '../../properties/schemas/property.schema';

export type ReportDocument =
  HydratedDocument<Report>;

@Schema({
  timestamps: true,
})
export class Report {
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  reporter: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: Property.name,
    required: true,
  })
  property: Types.ObjectId;

  @Prop({
    required: true,
    enum: [
      'Scam',
      'FakePhotos',
      'Broker',
      'Spam',
      'AlreadyRented',
      'Other',
    ],
  })
  reason: string;

  @Prop({
    default: '',
  })
  description: string;

  @Prop({
    default: 'Pending',
    enum: [
      'Pending',
      'Reviewed',
      'Rejected',
    ],
  })
  status: string;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
  })
  reviewedBy?: Types.ObjectId;

  @Prop()
  reviewNote?: string;
}

export const ReportSchema =
  SchemaFactory.createForClass(
    Report,
  );

ReportSchema.index(
  {
    reporter: 1,
    property: 1,
  },
  {
    unique: true,
  },
);

ReportSchema.index({
  property: 1,
});

ReportSchema.index({
  reporter: 1,
});

ReportSchema.index({
  status: 1,
});

ReportSchema.index({
  createdAt: -1,
});