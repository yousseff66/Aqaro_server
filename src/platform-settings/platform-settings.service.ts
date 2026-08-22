import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  PlatformSettings,
  PlatformSettingsDocument,
} from './schemas/platform-settings.schema';

import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';

@Injectable()
export class PlatformSettingsService {
  constructor(
    @InjectModel(PlatformSettings.name)
    private readonly settingsModel: Model<PlatformSettingsDocument>,
  ) {}

  async getSettings() {
    let settings = await this.settingsModel.findOne();

    if (!settings) {
      settings = await this.settingsModel.create({});
    }

    return settings;
  }

  async update(
    dto: UpdatePlatformSettingsDto,
  ) {
    let settings = await this.settingsModel.findOne();

    if (!settings) {
      settings = await this.settingsModel.create({});
    }

    Object.assign(settings, dto);

    return settings.save();
  }

  async listingPrices() {
  const settings = await this.getSettings();

  return {
    normal: settings.normalListingPrice,
    featuredPriceWeek: settings.featuredPriceWeek,
    featuredPriceTwoWeeks: settings.featuredPriceTwoWeeks,
    featuredPriceMonth: settings.featuredPriceMonth,
  };
}

  async listingDuration() {
    const settings = await this.getSettings();
    return settings.listingDurationDays;
  }
}