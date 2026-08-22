import {
  Prop,
  Schema,
  SchemaFactory,
  raw,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export type PropertyDocument =
  HydratedDocument<Property>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Property {
  @Prop({
    required: true,
    trim: true,
  })
  title!: string;

  @Prop({
    required: true,
    trim: true,
  })
  description!: string;

  @Prop({
    required: true,
    min: 1,
  })
  price!: number;

  @Prop({
    required: true,
  })
  governorate!: string;

  @Prop({
    required: true,
  })
  city!: string;

  @Prop({
    required: true,
  })
  address!: string;

  @Prop({
    required: true,
    min: 0,
  })
  bedrooms!: number;

  @Prop({
    required: true,
    min: 1,
  })
  bathrooms!: number;

  @Prop({
    required: true,
    min: 1,
  })
  area!: number;

  @Prop()
  floor?: number;

  @Prop({
    enum: [
      'Apartment',
      'Studio',
      'Villa',
      'Duplex',
      'Penthouse',
      'Townhouse',
      'Twin House',
      'Chalet',
      'Farm',
      'Land',
      'Office',
      'Shop',
      'Clinic',
      'Warehouse',
      'Factory',
      'Building',
      'Room',
    ],
    default: 'Apartment',
  })
  propertyType!: string;

  @Prop({
    enum: ['Sale', 'Rent'],
    required: true,
  })
  listingPurpose!: 'Sale' | 'Rent';

  @Prop({
    default: false,
  })
  furnished!: boolean;

  @Prop({
    type: [String],
    default: [],
  })
  images!: string[];

  @Prop({
    type: [String],
    default: [],
  })
  imagePublicIds!: string[];

  @Prop({
    enum: [
      'PendingPayment',
      'Pending',
      'Published',
      'Rented',
      'Rejected',
      'Expired',
      'Deleting',
    ],
    default: 'Pending',
  })
  status!: string;

  @Prop({
    default: 0,
  })
  views!: number;

  @Prop({
    default: 0,
  })
  favoritesCount!: number;

  @Prop({
    enum: ['Normal', 'Featured'],
    default: 'Normal',
  })
  listingType!: 'Normal' | 'Featured';

  @Prop({
    enum: ['week', 'twoWeeks', 'month'],
  })
  featuredDuration?: 'week' | 'twoWeeks' | 'month';

  @Prop({
    type: Date,
    default: null,
  })
  featuredExpiresAt?: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  publishedAt?: Date;

  @Prop({
    type: Date,
    default: null,
  })
  expiryReminderSentAt: Date | null;

  @Prop({
    required: true,
  })
  expiresAt!: Date;

  @Prop({
    default: true,
  })
  showExactLocation!: boolean;

  @Prop(
    raw({
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
      },
    }),
  )
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  owner!: Types.ObjectId;
}

export const PropertySchema =
  SchemaFactory.createForClass(
    Property,
  );

PropertySchema.virtual('isFeatured').get(function () {
  return this.listingType === 'Featured';
});

PropertySchema.index({
  owner: 1,
});

PropertySchema.index({
  status: 1,
});

PropertySchema.index({
  city: 1,
});

PropertySchema.index({
  governorate: 1,
});

PropertySchema.index({
  listingType: 1,
});

PropertySchema.index({
  listingPurpose: 1,
});

PropertySchema.index({
  expiresAt: 1,
});

PropertySchema.index({
  createdAt: -1,
});

PropertySchema.index({
  location: '2dsphere',
});