import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSupportDto } from './dto/create-support.dto';
import { SupportMessage, SupportMessageDocument } from './schemas/support-message.schema';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(SupportMessage.name) private supportMessageModel: Model<SupportMessageDocument>,
  ) {}

  async submitSupportRequest(user: any, createSupportDto: CreateSupportDto) {
    const newMessage = new this.supportMessageModel({
      user: user.userId,
      subject: createSupportDto.subject,
      message: createSupportDto.message,
    });
    
    await newMessage.save();

    return { success: true, message: 'Support request sent successfully.' };
  }

  async getAllSupportMessages() {
    return this.supportMessageModel
      .find()
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .exec();
  }

  async resolveMessage(id: string) {
    const message = await this.supportMessageModel.findByIdAndUpdate(
      id,
      { status: 'resolved' },
      { new: true }
    );
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    return message;
  }
}
