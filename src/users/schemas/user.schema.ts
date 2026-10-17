import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export class FcmToken {
  @Prop({ required: true })
  token!: string;

  @Prop({ required: true, enum: ['android', 'ios'] })
  platform!: string;

  @Prop()
  deviceId?: string;
}

@Schema({
  timestamps: true,
})
export class User {
  @Prop({
    required: true,
    unique: true,
    trim: true,
  })
  name!: string;

  @Prop({
    required: false,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    default: null,
  })
  email?: string | null;

  @Prop({
    enum: ['User', 'Admin'],
    default: 'User',
  })
  role!: string;

  @Prop({
    required: true,
  })
  password!: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
  })
  phone!: string;

  @Prop({ type: String, default: null })
  resetPasswordCode: string | null;

  @Prop({ type: Date, default: null })
  resetPasswordExpires: Date | null;

  @Prop({
    default: '',
  })
  avatar!: string;

  @Prop({
    default: false,
  })
  isVerified!: boolean;

  @Prop({
    default: false,
  })
  isBanned!: boolean;

  @Prop({ type: [FcmToken], default: [] })
  fcmTokens!: FcmToken[];
}

export const UserSchema = SchemaFactory.createForClass(User);
