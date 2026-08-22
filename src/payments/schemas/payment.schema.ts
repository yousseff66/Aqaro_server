import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { User } from '../../users/schemas/user.schema';
import { Property } from '../../properties/schemas/property.schema';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({
  timestamps: true,
})
export class Payment {
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  user: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: Property.name,
    required: true,
  })
  property: Types.ObjectId;

  @Prop({
    required: true,
  })
  amount: number;

  @Prop({
    enum: [
      'InstaPay',
      'VodafoneCash',
      'Visa',
    ],
    required: true,
  })
  paymentMethod: string;

  @Prop({
    required: true,
  })
  receiptImage: string;

  @Prop({
    required: true,
  })
  receiptPublicId: string;

  @Prop({
    enum: [
      'Pending',
      'Approved',
      'Rejected',
    ],
    default: 'Pending',
  })
  status: string;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
  })
  reviewedBy?: Types.ObjectId;

  @Prop({
    default: '',
  })
  reviewNote: string;

  @Prop()
  reviewedAt?: Date;

  @Prop({
  default: false,
})
isRenewal: boolean;

@Prop({
  type: Types.ObjectId,
  ref: Property.name,
})
renewProperty?: Types.ObjectId;
}

export const PaymentSchema =
  SchemaFactory.createForClass(Payment);

  PaymentSchema.index({
  user: 1,
});

PaymentSchema.index({
  property: 1,
});

PaymentSchema.index({
  status: 1,
});

PaymentSchema.index({
  createdAt: -1,
});