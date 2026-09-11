import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from './schemas/user.schema';
import { PropertiesService } from '../properties/properties.service';
import { FavoritesService } from '../favorites/favorites.service';
import { ReviewsService } from '../reviews/reviews.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ReportsService } from '../reports/reports.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly propertiesService: PropertiesService,
    private readonly favoritesService: FavoritesService,
    private readonly reviewsService: ReviewsService,
    private readonly notificationsService: NotificationsService,
    private readonly reportsService: ReportsService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  async findByPhone(phone: string) {
    return this.userModel.findOne({ phone });
  }

  async findById(id: string) {
    return this.userModel.findById(id).select('-password');
  }

  async setResetCode(
    id: string,
    code: string,
    expires: Date,
  ) {
    return this.userModel.findByIdAndUpdate(id, {
      resetPasswordCode: code,
      resetPasswordExpires: expires,
    });
  }

  async resetPassword(id: string, hashedPassword: string) {
    return this.userModel.findByIdAndUpdate(id, {
      password: hashedPassword,
      resetPasswordCode: null,
      resetPasswordExpires: null,
    });
  }

  async updatePhone(id: string, phone: string) {
    return this.userModel
      .findByIdAndUpdate(
        id,
        { phone },
        { new: true },
      )
      .select('-password');
  }

  async create(userData: Partial<User>) {
    const user = new this.userModel(userData);
    return user.save();
  }
  async countUsers() {
    return this.userModel.countDocuments();
  }

  async countAdmins() {
    return this.userModel.countDocuments({
      role: 'Admin',
    });
  }

  async latestUsers(limit = 5) {
    return this.userModel
      .find()
      .select('-password')
      .sort({
        createdAt: -1,
      })
      .limit(limit);
  }
  async findAll(
    page = 1,
    limit = 10,
    search?: string,
    ) {
    const filter: any = {};

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          email: {
            $regex: search,
            $options: 'i',
          },
        },
      ];
    }

    const total = await this.userModel.countDocuments(filter);

    const users = await this.userModel
      .find(filter)
      .select('-password')
      .sort({
        createdAt: -1,
      })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      total,
      page,
      pages: Math.ceil(total / limit),
      results: users,
    };
  }
  async updateRole(id: string, role: string) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = role;
    await user.save();

    return {
      message: 'Role updated successfully',
      user,
    };
  }

  async toggleBan(id: string) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isBanned = !user.isBanned;
    await user.save();

    return {
      message: user.isBanned
        ? 'User banned successfully'
        : 'User unbanned successfully',
      isBanned: user.isBanned,
    };
  }

  async addFcmToken(userId: string, token: string, platform: string, deviceId?: string) {
    await this.userModel.findByIdAndUpdate(userId, {
      $pull: { fcmTokens: { token } },
    });

    return this.userModel.findByIdAndUpdate(userId, {
      $push: { fcmTokens: { token, platform, deviceId } },
    });
  }

  async removeFcmToken(userId: string, token: string) {
    return this.userModel.findByIdAndUpdate(userId, {
      $pull: { fcmTokens: { token } },
    });
  }

  async removeDeadTokens(tokens: string[]) {
    return this.userModel.updateMany(
      { 'fcmTokens.token': { $in: tokens } },
      { $pull: { fcmTokens: { token: { $in: tokens } } } },
    );
  }

  async getFcmTokensByCategory(category: string): Promise<string[]> {
    let filter: any = {};

    if (category === 'new_users') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filter.createdAt = { $gte: sevenDaysAgo };
    }

    const users = await this.userModel.find(filter).select('fcmTokens');
    const allTokens = users.flatMap((u) => (u.fcmTokens || []).map((t) => t.token));

    return [...new Set(allTokens)];
  }

  async getTokensByIds(ids: any[]): Promise<string[]> {
    const users = await this.userModel.find({ _id: { $in: ids } }).select('fcmTokens');
    const allTokens = users.flatMap((u) => (u.fcmTokens || []).map((t) => t.token));

    return [...new Set(allTokens)];
  }

  async deleteUser(id: string) {
    // Run all deletions concurrently for much faster performance
    await Promise.all([
      this.propertiesService.deleteAllUserProperties(id),
      this.favoritesService.deleteUserFavorites(id),
      this.reviewsService.deleteUserReviews(id),
      this.notificationsService.deleteUserNotifications(id),
      this.reportsService.deleteUserReports(id),
      this.paymentsService.deleteUserPayments(id),
    ]);

    // Delete the user itself
    return this.userModel.findByIdAndDelete(id);
  }
}
