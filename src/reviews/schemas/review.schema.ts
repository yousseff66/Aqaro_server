import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { HydratedDocument, Types } from 'mongoose';

import { User } from '../../users/schemas/user.schema';
import { Property } from '../../properties/schemas/property.schema';

export type ReviewDocument = HydratedDocument<Review>;

@Schema({
  timestamps: true,
})
export class Review {
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  reviewer: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  reviewedUser: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: Property.name,
    required: true,
  })
  property: Types.ObjectId;

  @Prop({
    required: true,
    min: 1,
    max: 5,
  })
  rating: number;

  @Prop({
    default: '',
  })
  comment: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index(
  {
    user: 1,
    property: 1,
  },
  {
    unique: true,
  },
);

ReviewSchema.index({
  property: 1,
});

ReviewSchema.index({
  createdAt: -1,
});
