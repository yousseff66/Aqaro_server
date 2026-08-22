import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FavoriteDocument = HydratedDocument<Favorite>;

@Schema({
  timestamps: true,
})
export class Favorite {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Property',
    required: true,
  })
  property!: Types.ObjectId;
}

export const FavoriteSchema =
  SchemaFactory.createForClass(Favorite);

FavoriteSchema.index(
  {
    user: 1,
    property: 1,
  },
  {
    unique: true,
  },
);

FavoriteSchema.index({
  user: 1,
});

FavoriteSchema.index({
  property: 1,
});