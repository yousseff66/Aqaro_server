import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging, type MulticastMessage } from 'firebase-admin/messaging';
import { UsersService } from '../users/users.service';

@Injectable()
export class PushNotificationService implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(private readonly usersService: UsersService) {}

  onModuleInit() {
    if (!getApps().length) {
      try {
        const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (!raw) {
          this.logger.warn(
            'FIREBASE_SERVICE_ACCOUNT is not set. Firebase push notifications will be disabled locally.',
          );
          return;
        }
        const serviceAccount = JSON.parse(raw) as Record<string, unknown>;
        initializeApp({
          credential: cert(serviceAccount),
        });
        this.logger.log('Firebase Admin SDK initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize Firebase Admin SDK', error);
      }
    }
  }

  async sendToTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    // فلترة التوكنز
    const validTokens = tokens.filter(
      (t) => typeof t === 'string' && t.length > 0,
    );

    if (!validTokens.length) {
      this.logger.warn('No valid tokens to send to');
      return { successCount: 0, failureCount: tokens.length };
    }

    if (!getApps().length) {
      this.logger.warn('Firebase is not initialized');
      return { successCount: 0, failureCount: validTokens.length };
    }

    // بناء الرسالة بشكل متوافق مع iOS و Android
    const message: MulticastMessage = {
      tokens: validTokens,
      notification: { title, body }, // أساسي للظهور على شاشة القفل في iOS
      data: data ?? {},
      apns: {
        headers: {
          'apns-priority': '10', // أولوية قصوى
          'apns-push-type': 'alert',
        },
        payload: {
          aps: {
            alert: { title, body },
            sound: 'default',
            badge: 1,
            'content-available': 1, // مهم جداً لاستلام الإشعار في الخلفية
            'mutable-content': 1,
          },
        },
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          // تغيير 'default' لـ 'high_importance_channel' ليطابق كود الفلاتر
          channelId: 'high_importance_channel',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
    };

    try {
      const response = await getMessaging().sendEachForMulticast(message);

      this.logger.log(
        `Push sent: ${response.successCount} success, ${response.failureCount} failed`,
      );

      // تنظيف التوكنز التالفة
      const deadTokens: string[] = [];
      response.responses.forEach((r, index) => {
        if (!r.success) {
          const code = r.error?.code;
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token'
          ) {
            deadTokens.push(validTokens[index]);
          }
          this.logger.error(
            `Token Error [${validTokens[index].slice(0, 10)}...]: ${code}`,
          );
        }
      });

      if (deadTokens.length) {
        await this.usersService.removeDeadTokens(deadTokens);
      }

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      this.logger.error('Failed to send push notification', error);
      throw error;
    }
  }

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    const tokens = await this.usersService.getTokensByIds([userId]);
    return this.sendToTokens(tokens, title, body, data);
  }
}
