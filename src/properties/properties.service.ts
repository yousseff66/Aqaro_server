import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreatePropertyDto } from './dto/create-property.dto';
import { GetPropertiesDto } from './dto/get-properties.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { Property, PropertyDocument } from './schemas/property.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly platformSettingsService: PlatformSettingsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
  createPropertyDto: CreatePropertyDto,
  ownerId: string,
  files: Express.Multer.File[],
) {
  const imageUrls: string[] = [];
  const publicIds: string[] = [];

  try {
    if (files?.length) {
      for (const file of files) {
        const result: any =
          await this.cloudinaryService.uploadImage(file);

        imageUrls.push(result.secure_url);
        publicIds.push(result.public_id);
      }
    }

    const settings =
      await this.platformSettingsService.getSettings();

    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() +
        settings.listingDurationDays,
    );

    let status: string;

    if (createPropertyDto.listingType === 'Featured') {
      if (!createPropertyDto.featuredDuration) {
        throw new BadRequestException(
          'featuredDuration is required for Featured listings',
        );
      }

      const featuredPrice = {
        week: settings.featuredPriceWeek,
        twoWeeks: settings.featuredPriceTwoWeeks,
        month: settings.featuredPriceMonth,
      }[createPropertyDto.featuredDuration];

      status = featuredPrice === 0 ? 'Pending' : 'PendingPayment';
    } else {
      status =
        settings.normalListingPrice === 0
          ? 'Pending'
          : 'PendingPayment';
    }

    const property =
      new this.propertyModel({
        ...createPropertyDto,
        owner: new Types.ObjectId(ownerId),
        images: imageUrls,
        imagePublicIds: publicIds,
        status,
        expiresAt,
      });

    if (
      createPropertyDto.location?.coordinates &&
      createPropertyDto.location.coordinates
        .length === 2
    ) {
      property.location = {
        type: 'Point',
        coordinates:
          createPropertyDto.location
            .coordinates,
      };
    }

    return await property.save();
  } catch (error) {
    await Promise.all(
      publicIds.map((id) =>
        this.cloudinaryService.deleteImage(id),
      ),
    );

    throw error;
  }
}

  async findAll(query: GetPropertiesDto) {
    const {
  page = '1',
  limit = '10',
  city,
  governorate,
  minPrice,
  maxPrice,
  bedrooms,
  propertyType,
  search,
  featured,
  listingPurpose,
  sort = 'latest',
} = query;

    const filter: any = {
  status: 'Published',
};

    if (city) filter.city = city;
    if (governorate) filter.governorate = governorate;
    if (propertyType) filter.propertyType = propertyType;
    if (bedrooms) filter.bedrooms = Number(bedrooms);
    if (featured === 'true') {
      filter.listingType = 'Featured';
    }
    if (listingPurpose) {
      filter.listingPurpose = listingPurpose;
    }
    if (search) {
      const stopWords = new Set([
        'في', 'من', 'على', 'عن', 'مع', 'حتى', 'او', 'أو', 'و', 'ثم', 'ف', 'ب', 'ل', 'ال',
        'in', 'on', 'at', 'from', 'with', 'and', 'or', 'for', 'of', 'to', 'the', 'a', 'an'
      ]);

      const words = search
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 1 && !stopWords.has(word));

      if (words.length > 0) {
        const andConditions: any[] = [];

        const purposeMap = [
          { value: 'Sale', keywords: ['sale', 'buy', 'بيع', 'للبيع', 'شراء', 'تمليك'] },
          { value: 'Rent', keywords: ['rent', 'ايجار', 'إيجار', 'للإيجار', 'للايجار', 'قانون'] }
        ];

        const furnishedMap = [
          { value: true, keywords: ['مفروش', 'مفروشة', 'مفروشه', 'بالعفش', 'بالأثاث', 'بالاثاث', 'furnished'] },
          { value: false, keywords: ['غير مفروش', 'بدون فرش', 'بدون عفش', 'فاضي', 'فاضية', 'unfurnished'] }
        ];

        const typeMap = [
          { value: 'Apartment', keywords: ['شقة', 'شقه', 'شقق', 'apartment', 'apartments'] },
          { value: 'Studio', keywords: ['استوديو', 'إستوديو', 'studio', 'studios'] },
          { value: 'Villa', keywords: ['فيلا', 'فيلّا', 'فيلات', 'فلل', 'villa', 'villas'] },
          { value: 'Duplex', keywords: ['دوبلكس', 'duplex', 'duplexes'] },
          { value: 'Penthouse', keywords: ['بنتهاوس', 'بنت هاوس', 'penthouse', 'penthouses'] },
          { value: 'Townhouse', keywords: ['تاون هاوس', 'تاون', 'townhouse', 'townhouses'] },
          { value: 'Twin House', keywords: ['توين هاوس', 'توين', 'twin', 'twin house', 'twin houses'] },
          { value: 'Chalet', keywords: ['شاليه', 'شاليات', 'شاليهات', 'chalet', 'chalets'] },
          { value: 'Farm', keywords: ['مزرعة', 'مزرعه', 'مزارع', 'farm', 'farms'] },
          { value: 'Land', keywords: ['أرض', 'ارض', 'أراضي', 'اراضي', 'land', 'lands'] },
          { value: 'Office', keywords: ['مكتب', 'مكتبية', 'مكاتب', 'office', 'offices'] },
          { value: 'Shop', keywords: ['محل', 'محلات', 'دكان', 'دكاكين', 'متجر', 'shop', 'shops', 'store', 'stores'] },
          { value: 'Clinic', keywords: ['عيادة', 'عياده', 'عيادات', 'clinic', 'clinics', 'طبي', 'طبية'] },
          { value: 'Warehouse', keywords: ['مخزن', 'مستودع', 'مخازن', 'warehouse', 'warehouses'] },
          { value: 'Factory', keywords: ['مصنع', 'مصانع', 'factory', 'factories'] },
          { value: 'Building', keywords: ['عمارة', 'عماره', 'مبنى', 'مباني', 'برج', 'أبراج', 'ابراج', 'building', 'buildings'] },
          { value: 'Room', keywords: ['غرفة', 'غرفه', 'غرف', 'room', 'rooms'] }
        ];

        for (const word of words) {
          const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const wordRegex = new RegExp(escapedWord, 'i');

          const orConditions: any[] = [
            { title: { $regex: wordRegex } },
            { description: { $regex: wordRegex } },
            { city: { $regex: wordRegex } },
            { governorate: { $regex: wordRegex } },
            { address: { $regex: wordRegex } }
          ];

          for (const purpose of purposeMap) {
            if (purpose.keywords.some((k) => k.includes(word) || word.includes(k))) {
              orConditions.push({ listingPurpose: purpose.value });
            }
          }

          for (const furn of furnishedMap) {
            if (furn.keywords.some((k) => k.includes(word) || word.includes(k))) {
              orConditions.push({ furnished: furn.value });
            }
          }

          for (const type of typeMap) {
            if (type.keywords.some((k) => k.includes(word) || word.includes(k))) {
              orConditions.push({ propertyType: type.value });
            }
          }

          andConditions.push({ $or: orConditions });
        }

        if (andConditions.length > 0) {
          filter.$and = andConditions;
        }
      }
    }
    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    let sortOption: any = {  listingType: -1 , publishedAt: -1,};

    if (sort === 'priceAsc') {
  sortOption = {
    listingType: -1,
    price: 1,
  };
}

if (sort === 'priceDesc') {
  sortOption = {
    listingType: -1,
    price: -1,
  };
}

    const currentPage = Number(page);
    const pageSize = Number(limit);

    const total = await this.propertyModel.countDocuments(filter);

    const properties = await this.propertyModel
      .find(filter)
      .populate('owner', 'name') // ← بدون رقم
      .sort(sortOption)
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);

    return {
      total,
      page: currentPage,
      pages: Math.ceil(total / pageSize),
      results: properties,
    };
  }

  async findOne(id: string) {
    await this.propertyModel.findByIdAndUpdate(
  id,
  {
    $inc: {
      views: 1,
    },
  },
);
    const property = await this.propertyModel
      .findById(id)
      .populate('owner', 'name phone');

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const result = property.toObject();

    const owner = result.owner as any;

    if (owner?.phone) {
      owner.whatsappLink = `https://wa.me/${owner.phone.replace(/\D/g, '')}`;
    }

    return result;
  }

  async update(
    id: string,
    updatePropertyDto: UpdatePropertyDto,
    userId: string,
  ) {
    const property = await this.propertyModel.findById(id);

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.owner.toString() !== userId) {
      throw new ForbiddenException(
        'You are not allowed to update this property',
      );
    }

    return this.propertyModel.findByIdAndUpdate(id, updatePropertyDto, {
      new: true,
      runValidators: true,
    });
  }

  async remove(
    id: string,
    userId: string,
  ) {
    const property = await this.propertyModel.findById(id);

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.owner.toString() !== userId) {
      throw new ForbiddenException(
        'You are not allowed to delete this property',
      );
    }
    if (property.imagePublicIds?.length) {
  await Promise.all(
    property.imagePublicIds.map((publicId) =>
      this.cloudinaryService.deleteImage(publicId),
    ),
  );
}

    await this.propertyModel.findByIdAndDelete(id);

    return {
      message: 'Property deleted successfully',
    };
  }

  async updateImages(
  id: string,
  userId: string,
  files: Express.Multer.File[],
  removedImages: string[],
) {
  const property = await this.propertyModel.findById(id);

  if (!property) {
    throw new NotFoundException(
      'Property not found',
    );
  }

  if (property.owner.toString() !== userId) {
    throw new ForbiddenException(
      'You are not allowed to update this property',
    );
  }

  const uploadedPublicIds: string[] = [];

  try {
    // حذف الصور المطلوبة
    if (removedImages?.length) {
      for (const publicId of removedImages) {
        await this.cloudinaryService.deleteImage(
          publicId,
        );

        const index =
          property.imagePublicIds.indexOf(publicId);

        if (index !== -1) {
          property.imagePublicIds.splice(index, 1);
          property.images.splice(index, 1);
        }
      }
    }

    // رفع الصور الجديدة
    if (files?.length) {
      for (const file of files) {
        const result: any =
          await this.cloudinaryService.uploadImage(file);

        uploadedPublicIds.push(result.public_id);

        property.images.push(result.secure_url);
        property.imagePublicIds.push(result.public_id);
      }
    }

    // الحد الأقصى للصور
    const settings =
  await this.platformSettingsService.getSettings();

if (
  property.images.length >
  settings.maxImagesPerProperty
) {
  throw new ForbiddenException(
    `Maximum ${settings.maxImagesPerProperty} images are allowed`,
  );
}

    await property.save();

    return property;
  } catch (error) {
    await Promise.all(
      uploadedPublicIds.map((id) =>
        this.cloudinaryService.deleteImage(id),
      ),
    );

    throw error;
  }
}


  async findMyProperties(
  userId: string,
  query: GetPropertiesDto,
) {
  const {
    page = '1',
    limit = '10',
    sort = 'latest',
    status,
  } = query;

  const filter: any = {
    owner: new Types.ObjectId(userId),
  };

  if (status) {
    filter.status = status;
  }

  let sortOption: any = {
    createdAt: -1,
  };

  if (sort === 'priceAsc') {
    sortOption = { price: 1 };
  }

  if (sort === 'priceDesc') {
    sortOption = { price: -1 };
  }

  const currentPage = Number(page);
  const pageSize = Number(limit);

  const total = await this.propertyModel.countDocuments(filter);

  const properties = await this.propertyModel
    .find(filter)
    .sort(sortOption)
    .skip((currentPage - 1) * pageSize)
    .limit(pageSize);

  return {
    total,
    page: currentPage,
    pages: Math.ceil(total / pageSize),
    results: properties,
  };
}
async getMyStats(userId: string) {
  const ownerId = new Types.ObjectId(userId);

  const [
    total,
    pending,
    published,
    rented,
    rejected,
    expired,
  ] = await Promise.all([
    this.propertyModel.countDocuments({ owner: ownerId }),
    this.propertyModel.countDocuments({
      owner: ownerId,
      status: 'Pending',
    }),
    this.propertyModel.countDocuments({
      owner: ownerId,
      status: 'Published',
    }),
    this.propertyModel.countDocuments({
      owner: ownerId,
      status: 'Rented',
    }),
    this.propertyModel.countDocuments({
      owner: ownerId,
      status: 'Rejected',
    }),
    this.propertyModel.countDocuments({
      owner: ownerId,
      status: 'Expired',
    }),
  ]);

  return {
    total,
    pending,
    published,
    rented,
    rejected,
    expired,
  };
}
async findNearby(
  lat: string,
  lng: string,
  radius = '5',
) {
  return this.propertyModel.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [
            Number(lng),
            Number(lat),
          ],
        },
        $maxDistance:
          Number(radius) * 1000,
      },
    },
    status: 'Published',
  });
}
async getPendingProperties() {
  return this.propertyModel
    .find({
      status: 'Pending',
    })
    .populate('owner', 'name email phone')
    .sort({
      createdAt: -1,
    });
}

async updatePropertyStatus(
  id: string,
  status: string,
  reviewNote?: string,
) {
  const property = await this.propertyModel.findById(id);

  if (!property) {
    throw new NotFoundException(
      'Property not found',
    );
  }

  property.status = status;

  if (status === 'Published') {
    property.publishedAt = new Date();

    if (property.listingType === 'Featured' && property.featuredDuration) {
      const durationDays = {
        week: 7,
        twoWeeks: 14,
        month: 30,
      }[property.featuredDuration];

      const featuredExpiry = new Date();
      featuredExpiry.setDate(
        featuredExpiry.getDate() + durationDays,
      );
      property.featuredExpiresAt = featuredExpiry;
    }

    await property.save();

    await this.notificationsService.createNotification(
      property.owner.toString(),
      'Property Published',
      'Congratulations! Your property has been published successfully.',
      'PropertyPublished',
      property._id.toString(),
    );
  } else if (status === 'Rejected') {
    await property.save();

    await this.notificationsService.createNotification(
      property.owner.toString(),
      'Property Rejected',
      reviewNote || 'Your property has been rejected by the admin.',
      'PropertyRejected',
      property._id.toString(),
    );
  } else {
    await property.save();
  }

  return {
    message: `Property ${status.toLowerCase()} successfully`,
    property,
  };
}

async toggleFeatured(
  id: string,
) {
  const property = await this.propertyModel.findById(id);

  if (!property) {
    throw new NotFoundException(
      'Property not found',
    );
  }

  property.listingType =
property.listingType === 'Featured'
? 'Normal'
: 'Featured';

  await property.save();

  return {
    message: property.listingType === 'Featured'
      ? 'Property featured successfully'
      : 'Property removed from featured',
    property,
  };
}
async getDashboardStats(
  startDate?: Date,
  endDate?: Date,
) {
  const dateFilter: any = {};

  if (startDate || endDate) {
    dateFilter.createdAt = {};

    if (startDate) {
      dateFilter.createdAt.$gte = startDate;
    }

    if (endDate) {
      dateFilter.createdAt.$lte = endDate;
    }
  }

  const [
    total,
    pending,
    published,
    rejected,
    rented,
    expired,
    featured,
  ] = await Promise.all([
    this.propertyModel.countDocuments(dateFilter),
    this.propertyModel.countDocuments({
      ...dateFilter,
      status: 'Pending',
    }),
    this.propertyModel.countDocuments({
      ...dateFilter,
      status: 'Published',
    }),
    this.propertyModel.countDocuments({
      ...dateFilter,
      status: 'Rejected',
    }),
    this.propertyModel.countDocuments({
      ...dateFilter,
      status: 'Rented',
    }),
    this.propertyModel.countDocuments({
      ...dateFilter,
      status: 'Expired',
    }),
    this.propertyModel.countDocuments({
      ...dateFilter,
      listingType: 'Featured',
    }),
  ]);

  const views = await this.propertyModel.aggregate([
    {
      $match: dateFilter,
    },
    {
      $group: {
        _id: null,
        totalViews: {
          $sum: '$views',
        },
        totalFavorites: {
          $sum: '$favoritesCount',
        },
      },
    },
  ]);

  return {
    total,
    pending,
    published,
    rejected,
    rented,
    expired,
    featured,
    views: views[0]?.totalViews ?? 0,
    favorites: views[0]?.totalFavorites ?? 0,
  };
}
async getTopCities(limit = 5) {
  return this.propertyModel.aggregate([
    {
      $match: {
        status: 'Published',
      },
    },
    {
      $group: {
        _id: '$city',
        count: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        count: -1,
      },
    },
    {
      $limit: limit,
    },
    {
      $project: {
        _id: 0,
        city: '$_id',
        count: 1,
      },
    },
  ]);
}
async getTopViewed(limit = 5) {
  return this.propertyModel
    .find({
      status: 'Published',
    })
    .select(
      'title city price views favoritesCount images listingType',
    )
    .sort({
      views: -1,
    })
    .limit(limit);
}
async latestProperties(limit = 5) {
  return this.propertyModel
    .find()
    .select(
      'title price city status listingType views favoritesCount images createdAt',
    )
    .populate('owner', 'name')
    .sort({
      createdAt: -1,
    })
    .limit(limit);
}
async latestPublished(limit = 5) {
  return this.propertyModel
    .find({
      status: 'Published',
    })
    .select(
      'title price city views favoritesCount images publishedAt listingType',
    )
    .populate('owner', 'name')
    .sort({
      publishedAt: -1,
    })
    .limit(limit);
}
async deleteAllUserProperties(userId: string) {
  const properties = await this.propertyModel.find({
    owner: new Types.ObjectId(userId),
  });

  for (const property of properties) {
    if (property.imagePublicIds?.length) {
      await Promise.all(
        property.imagePublicIds.map((publicId) =>
          this.cloudinaryService.deleteImage(publicId),
        ),
      );
    }
  }

  await this.propertyModel.deleteMany({
    owner: new Types.ObjectId(userId),
  });
}

async getOwnerIdsByStatus(status?: string): Promise<any[]> {
  const filter: any = status ? { status } : {};
  return this.propertyModel.distinct('owner', filter);
}

}