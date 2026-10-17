import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SupportMessageDocument = SupportMessage & Document;

@Schema({ timestamps: true })
export class SupportMessage {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: 'pending', enum: ['pending', 'resolved'] })
  status: string;
}

export const SupportMessageSchema =
  SchemaFactory.createForClass(SupportMessage);
