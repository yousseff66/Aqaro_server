import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PlatformSettingsDocument = HydratedDocument<PlatformSettings>;

@Schema({ _id: false })
class InstaPaySettings {
  @Prop({
    default: true,
  })
  enabled: boolean;

  @Prop({
    default: '',
  })
  name: string;

  @Prop({
    default: '',
  })
  number: string;
}

@Schema({ _id: false })
class VodafoneCashSettings {
  @Prop({
    default: true,
  })
  enabled: boolean;

  @Prop({
    default: '',
  })
  number: string;
}

@Schema({ _id: false })
class VisaSettings {
  @Prop({
    default: true,
  })
  enabled: boolean;

  @Prop({
    default: '',
  })
  holder: string;

  @Prop({
    default: '',
  })
  bank: string;

  @Prop({
    default: '',
  })
  cardNumber: string;
}

@Schema({ _id: false })
class PaymentMethods {
  @Prop({
    type: InstaPaySettings,
    default: {},
  })
  instaPay: InstaPaySettings;

  @Prop({
    type: VodafoneCashSettings,
    default: {},
  })
  vodafoneCash: VodafoneCashSettings;

  @Prop({
    type: VisaSettings,
    default: {},
  })
  visa: VisaSettings;
}

@Schema({
  timestamps: true,
})
export class PlatformSettings {
  @Prop({
    default: 500,
  })
  normalListingPrice: number;

  @Prop({ default: 60 })
  featuredPriceWeek: number;

  @Prop({ default: 120 })
  featuredPriceTwoWeeks: number;

  @Prop({ default: 150 })
  featuredPriceMonth: number;

  @Prop({
    default: 30,
  })
  listingDurationDays: number;

  @Prop({
    type: PaymentMethods,
    default: {},
  })
  paymentMethods: PaymentMethods;

  @Prop({
    default: '',
  })
  supportPhone: string;

  @Prop({
    default: '',
  })
  supportEmail: string;

  @Prop({
    default: 10,
  })
  maxImagesPerProperty: number;
}

export const PlatformSettingsSchema =
  SchemaFactory.createForClass(PlatformSettings);
