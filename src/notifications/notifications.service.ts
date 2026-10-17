import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
    propertyId?: string,
    paymentId?: string,
  ) {
    return this.notificationModel.create({
      user: new Types.ObjectId(userId),
      title,
      message,
      type,
      property: propertyId ? new Types.ObjectId(propertyId) : undefined,
      payment: paymentId ? new Types.ObjectId(paymentId) : undefined,
    });
  }

  async getMyNotifications(userId: string) {
    return this.notificationModel
      .find({
        user: new Types.ObjectId(userId),
      })
      .populate('property', 'title images')
      .sort({
        createdAt: -1,
      });
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationModel.countDocuments({
      user: new Types.ObjectId(userId),
      isRead: false,
    });

    return { count };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationModel.findById(id);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.user.toString() !== userId) {
      throw new ForbiddenException('Not allowed');
    }

    notification.isRead = true;

    await notification.save();

    return {
      message: 'Notification marked as read',
    };
  }

  async markAllAsRead(userId: string) {
    await this.notificationModel.updateMany(
      {
        user: new Types.ObjectId(userId),
        isRead: false,
      },
      {
        isRead: true,
      },
    );

    return {
      message: 'All notifications marked as read',
    };
  }

  async remove(id: string, userId: string) {
    const notification = await this.notificationModel.findById(id);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.user.toString() !== userId) {
      throw new ForbiddenException('Not allowed');
    }

    await notification.deleteOne();

    return {
      message: 'Notification deleted successfully',
    };
  }

  async deleteUserNotifications(userId: string) {
    await this.notificationModel.deleteMany({
      user: new Types.ObjectId(userId),
    });
  }
}
