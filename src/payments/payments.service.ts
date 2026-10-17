import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Payment, PaymentDocument } from './schemas/payment.schema';

import {
  Property,
  PropertyDocument,
} from '../properties/schemas/property.schema';

import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,

    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,

    private readonly cloudinaryService: CloudinaryService,

    private readonly platformSettingsService: PlatformSettingsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    dto: CreatePaymentDto,
    userId: string,
    file: Express.Multer.File,
  ) {
    const property = await this.propertyModel.findById(dto.propertyId);

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.owner.toString() !== userId) {
      throw new BadRequestException('Not allowed');
    }

    if (property.status !== 'PendingPayment') {
      throw new BadRequestException('This property is not waiting for payment');
    }

    const existingPayment = await this.paymentModel.findOne({
      property: property._id,
      status: 'Pending',
    });

    if (existingPayment) {
      throw new BadRequestException('Payment already submitted');
    }

    if (!file) {
      throw new BadRequestException(
        'Payment proof image (receipt) is required',
      );
    }

    const settings = await this.platformSettingsService.getSettings();

    const upload: any = await this.cloudinaryService.uploadImage(file);

    let amount: number;
    if (property.listingType === 'Featured') {
      const featuredPrices = {
        week: settings.featuredPriceWeek,
        twoWeeks: settings.featuredPriceTwoWeeks,
        month: settings.featuredPriceMonth,
      };
      amount =
        featuredPrices[
          property.featuredDuration as 'week' | 'twoWeeks' | 'month'
        ] ?? settings.featuredPriceWeek;
    } else {
      amount = settings.normalListingPrice;
    }

    const payment = await this.paymentModel.create({
      user: new Types.ObjectId(userId),

      property: property._id,

      amount,

      paymentMethod: dto.paymentMethod,

      receiptImage: upload.secure_url,

      receiptPublicId: upload.public_id,

      status: 'Pending',

      isRenewal: dto.isRenewal ?? false,

      renewProperty: dto.isRenewal ? property._id : undefined,
    });

    return payment;
  }

  async myPayments(userId: string) {
    return this.paymentModel
      .find({
        user: new Types.ObjectId(userId),
      })
      .populate('property', 'title price city images status listingType')
      .sort({
        createdAt: -1,
      });
  }

  async adminPayments(status?: string) {
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    return this.paymentModel
      .find(filter)
      .populate('user', 'name email phone')
      .populate('property', 'title city price status')
      .sort({
        createdAt: -1,
      });
  }

  async getDashboardStats(startDate?: Date, endDate?: Date) {
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

    const [pendingCount, approvedPayments] = await Promise.all([
      this.paymentModel.countDocuments({
        ...dateFilter,
        status: 'Pending',
      }),
      this.paymentModel
        .find({
          ...dateFilter,
          status: 'Approved',
        })
        .select('amount'),
    ]);

    const totalRevenue = approvedPayments.reduce(
      (sum, payment: any) => sum + (payment.amount || 0),
      0,
    );

    return {
      pending: pendingCount,
      totalRevenue,
    };
  }

  async approve(paymentId: string, adminId: string, reviewNote?: string) {
    const payment = await this.paymentModel.findById(paymentId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'Pending') {
      throw new BadRequestException('Payment already reviewed');
    }

    payment.status = 'Approved';
    payment.reviewedBy = new Types.ObjectId(adminId);
    payment.reviewedAt = new Date();
    payment.reviewNote = reviewNote ?? '';

    await payment.save();

    const property = await this.propertyModel.findById(payment.property);

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const settings = await this.platformSettingsService.getSettings();

    if (payment.isRenewal) {
      const expires =
        property.expiresAt > new Date() ? property.expiresAt : new Date();

      expires.setDate(expires.getDate() + settings.listingDurationDays);

      property.expiresAt = expires;
      property.status = 'Published';
      property.expiryReminderSentAt = null;
    } else {
      property.status = 'Pending';
    }

    await property.save();

    await this.notificationsService.createNotification(
      payment.user.toString(),
      'Payment Approved',
      payment.isRenewal
        ? 'Your renewal payment has been approved.'
        : 'Your payment has been approved and your property is waiting for review.',
      'PaymentApproved',
      payment.property.toString(),
      payment._id.toString(),
    );

    return {
      message: 'Payment approved successfully',
    };
  }

  async reject(paymentId: string, adminId: string, reviewNote?: string) {
    const payment = await this.paymentModel.findById(paymentId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'Pending') {
      throw new BadRequestException('Payment already reviewed');
    }

    payment.status = 'Rejected';
    payment.reviewedBy = new Types.ObjectId(adminId);
    payment.reviewedAt = new Date();
    payment.reviewNote = reviewNote ?? '';

    await payment.save();

    if (payment.isRenewal) {
      await this.propertyModel.findByIdAndUpdate(payment.property, {
        status: 'Published',
      });
    } else {
      await this.propertyModel.findByIdAndUpdate(payment.property, {
        status: 'PendingPayment',
      });
    }

    await this.notificationsService.createNotification(
      payment.user.toString(),
      'Payment Rejected',
      reviewNote || 'Your payment has been rejected.',
      'PaymentRejected',
      payment.property.toString(),
      payment._id.toString(),
    );

    await this.cloudinaryService.deleteImage(payment.receiptPublicId);

    return {
      message: 'Payment rejected successfully',
    };
  }
  async getPaymentMethods() {
    const settings = await this.platformSettingsService.getSettings();

    return {
      normalListingPrice: settings.normalListingPrice,
      featuredPriceWeek: settings.featuredPriceWeek,
      featuredPriceTwoWeeks: settings.featuredPriceTwoWeeks,
      featuredPriceMonth: settings.featuredPriceMonth,
      listingDurationDays: settings.listingDurationDays,
      paymentMethods: settings.paymentMethods,
      supportPhone: settings.supportPhone,
      supportEmail: settings.supportEmail,
      maxImagesPerProperty: settings.maxImagesPerProperty,
    };
  }

  async deleteUserPayments(userId: string) {
    const payments = await this.paymentModel.find({
      user: new Types.ObjectId(userId),
    });

    for (const payment of payments) {
      if (payment.receiptPublicId) {
        await this.cloudinaryService.deleteImage(payment.receiptPublicId);
      }
    }

    await this.paymentModel.deleteMany({
      user: new Types.ObjectId(userId),
    });
  }
}
