import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import {
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';

import { FilesInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ObjectIdValidationPipe } from '../common/pipes/object-id-validation.pipe';
import { CreatePropertyDto } from './dto/create-property.dto';
import { GetPropertiesDto } from './dto/get-properties.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertiesService } from './properties.service';
import { memoryStorage } from 'multer';
import { NearbyPropertiesDto } from './dto/nearby-properties.dto';

type AuthenticatedRequest = ExpressRequest & {
  user: {
    userId: string;
  };
};

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
  FilesInterceptor('images', 10, {
    storage: memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }),
)
  create(
    @Body() createPropertyDto: CreatePropertyDto,
    @Request() req: AuthenticatedRequest,
    @UploadedFiles(
  new ParseFilePipe({
    validators: [
      new MaxFileSizeValidator({
        maxSize: 5 * 1024 * 1024, // 5 MB
      }),
      new FileTypeValidator({
        fileType: /(jpg|jpeg|png|webp)$/i,
      }),
    ],
    fileIsRequired: false,
  }),
)
files: Express.Multer.File[],
  ) {
    return this.propertiesService.create(createPropertyDto,
      req.user.userId,
      files,
    );
  }

  @Get()
  findAll(@Query() query: GetPropertiesDto) {
    return this.propertiesService.findAll(query);
  }
  @Get('my')
@UseGuards(JwtAuthGuard)
findMyProperties(
  @Request() req: AuthenticatedRequest,
  @Query() query: GetPropertiesDto,
) {
  return this.propertiesService.findMyProperties(
    req.user.userId,
    query,
  );
}
@Get('my/stats')
@UseGuards(JwtAuthGuard)
getMyStats(
  @Request() req: AuthenticatedRequest,
) {
  return this.propertiesService.getMyStats(
    req.user.userId,
  );
}

@Get('nearby')
findNearby(
  @Query() query: NearbyPropertiesDto,
) {
  return this.propertiesService.findNearby(
    query.lat,
    query.lng,
    query.radius,
  );
}

  @Get(':id')
  findOne(@Param('id', ObjectIdValidationPipe) id: string) {
    return this.propertiesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ObjectIdValidationPipe) id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.propertiesService.update(
      id,
      updatePropertyDto,
      req.user.userId,
    );
  }

  @Patch(':id/images')
@UseGuards(JwtAuthGuard)
@UseInterceptors(
  FilesInterceptor('images', 10, {
    storage: memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  }),
)
updateImages(
  @Param('id', ObjectIdValidationPipe)
  id: string,

  @Body('removedImages')
  removedImages: string,

  @UploadedFiles(
  new ParseFilePipe({
    validators: [
      new MaxFileSizeValidator({
        maxSize: 5 * 1024 * 1024,
      }),
      new FileTypeValidator({
        fileType: /(jpg|jpeg|png|webp)$/i,
      }),
    ],
    fileIsRequired: false,
  }),
)
files: Express.Multer.File[],

  @Request()
  req: AuthenticatedRequest,
) {
  return this.propertiesService.updateImages(
    id,
    req.user.userId,
    files,
    removedImages
      ? JSON.parse(removedImages)
      : [],
  );
}

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id', ObjectIdValidationPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.propertiesService.remove(id, req.user.userId);
  }
}
