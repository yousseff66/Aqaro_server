import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import {
  Model,
  Types,
} from 'mongoose';

import {
  Report,
  ReportDocument,
} from './schemas/report.schema';

import {
  Property,
  PropertyDocument,
} from '../properties/schemas/property.schema';

import { CreateReportDto } from './dto/create-report.dto';
import { ReviewReportDto } from './dto/review-report.dto';
import { PropertiesService } from '../properties/properties.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<ReportDocument>,

    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    private readonly propertiesService: PropertiesService,

  ) {}

  async create(
    dto: CreateReportDto,
    userId: string,
  ) {
    const property =
      await this.propertyModel.findById(
        dto.propertyId,
      );

    if (!property) {
      throw new NotFoundException(
        'Property not found',
      );
    }

    if (
      property.owner.toString() === userId
    ) {
      throw new BadRequestException(
        'You cannot report your own property',
      );
    }

    const existing =
      await this.reportModel.findOne({
        reporter: new Types.ObjectId(userId),
        property: property._id,
      });

    if (existing) {
      throw new BadRequestException(
        'You already reported this property',
      );
    }

    return this.reportModel.create({
      reporter:
        new Types.ObjectId(userId),

      property:
        property._id,

      reason:
        dto.reason,

      description:
        dto.description ?? '',
    });
  }

  async myReports(
    userId: string,
  ) {
    return this.reportModel
      .find({
        reporter:
          new Types.ObjectId(userId),
      })
      .populate(
        'property',
        'title city status',
      )
      .sort({
        createdAt: -1,
      });
  }

  async adminReports(
    status?: string,
  ) {
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    return this.reportModel
      .find(filter)
      .populate(
        'reporter',
        'name email',
      )
      .populate(
        'property',
        'title city owner',
      )
      .sort({
        createdAt: -1,
      });
  }

  async countActive(
    startDate?: Date,
    endDate?: Date,
  ) {
    const filter: any = {
      status: 'Pending',
    };

    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        filter.createdAt.$gte = startDate;
      }

      if (endDate) {
        filter.createdAt.$lte = endDate;
      }
    }

    return this.reportModel.countDocuments(filter);
  }

  async review(
    reportId: string,
    adminId: string,
    dto: ReviewReportDto,
  ) {
    const report =
      await this.reportModel.findById(
        reportId,
      );

    if (!report) {
      throw new NotFoundException(
        'Report not found',
      );
    }

    report.status =
      dto.status;

    report.reviewedBy =
      new Types.ObjectId(adminId);

    report.reviewNote =
      dto.reviewNote ?? '';

    await report.save();

    return {
      message:
        'Report reviewed successfully',
    };
  }

  async remove(
    reportId: string,
    userId: string,
  ) {
    const report =
      await this.reportModel.findById(
        reportId,
      );

    if (!report) {
      throw new NotFoundException(
        'Report not found',
      );
    }

    if (
      report.reporter.toString() !==
      userId
    ) {
      throw new ForbiddenException(
        'Not allowed',
      );
    }

    await this.reportModel.findByIdAndDelete(
      reportId,
    );

    return {
      message:
        'Report deleted successfully',
    };
  }

  async adminDelete(
    reportId: string,
  ) {
    const report =
      await this.reportModel.findById(
        reportId,
      );

    if (!report) {
      throw new NotFoundException(
        'Report not found',
      );
    }

    await this.reportModel.findByIdAndDelete(
      reportId,
    );

    return {
      message:
        'Report deleted successfully',
    };
  }

  async deleteReportedProperty(
    reportId: string,
  ) {
    const report =
      await this.reportModel.findById(
        reportId,
      );

    if (!report) {
      throw new NotFoundException(
        'Report not found',
      );
    }

    await this.propertyModel.findByIdAndDelete(
      report.property,
    );

    report.status = 'Reviewed';

    await report.save();

    return {
      message:
        'Property deleted successfully',
    };
  }

  async deleteUserReports(userId: string) {
    await this.reportModel.deleteMany({
      reporter: new Types.ObjectId(userId),
    });
  }
}