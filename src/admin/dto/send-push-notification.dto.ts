import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class SendPushNotificationDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsIn(['all', 'property_owners', 'new_users', 'pending_payment'])
  category!: 'all' | 'property_owners' | 'new_users' | 'pending_payment';
}
