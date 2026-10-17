import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({
  timestamps: true,
})
export class Notification {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user: Types.ObjectId;

  @Prop({
    required: true,
  })
  title: string;

  @Prop({
    required: true,
  })
  message: string;

  @Prop({
    required: true,
  })
  type: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Property',
  })
  property?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Payment',
  })
  payment?: Types.ObjectId;

  @Prop({
    default: false,
  })
  isRead: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({
  user: 1,
});

NotificationSchema.index({
  isRead: 1,
});

NotificationSchema.index({
  createdAt: -1,
});

NotificationSchema.index({
  user: 1,
  isRead: 1,
});

NotificationSchema.index({
  user: 1,
  createdAt: -1,
});
