import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { MusicalService } from './musical.service';
import { CreateSingleDto, CreateProjectDto } from './dto/musical.dto';
import { JwtAuthGuard } from 'src/config/jwt-auth.guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Roles, RolesGuard } from 'src/config/roles.guard';
import {
  CreateSingleSchemaValidator,
  CreateProjectSchemaValidator,
} from 'src/pipes/input.validators';
import { JoiValidationPipe } from 'src/pipes/joi-validation.pipe';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('musical')
export class MusicalController {
  constructor(private readonly musicalService: MusicalService) {}

  @Post('single')
  @Roles('artist')
  uploadSingle(
    @Req() req,
    @Body(new JoiValidationPipe(CreateSingleSchemaValidator))
    dto: CreateSingleDto,
  ) {
    return this.musicalService.uploadSingle(req.user.userId, dto);
  }

  @Post('project')
  @Roles('artist')
  uploadProject(
    @Body(new JoiValidationPipe(CreateProjectSchemaValidator))
    dto: CreateProjectDto,
    @Req() req,
  ) {
    return this.musicalService.uploadProject(req.user.userId, dto);
  }

  @Get('single/:id')
  async getSingle(@Param('id') id: string) {
    return this.musicalService.getSingleById(id);
  }

  @Get('project/:id')
  async getProject(@Param('id') id: string) {
    return this.musicalService.getProjectById(id);
  }

  @Post('single/:id/play')
  async playSingle(@Param('id') id: string) {
    return this.musicalService.incrementSinglePlay(id);
  }

  @Post('project/:id/play/:trackIndex')
  async playProjectTrack(
    @Param('id') id: string,
    @Param('trackIndex') index: string,
  ) {
    return this.musicalService.incrementProjectTrackPlay(id, parseInt(index));
  }

  @Get('metadata-options')
  getMetadataOptions() {
    return this.musicalService.getTrackMetadataOptions();
  }

  @Post('upload-multiple-files')
  @UseInterceptors(FilesInterceptor('files')) // field name: files[]
  uploadMultiple(@UploadedFiles() files: Express.Multer.File[], @Req() req) {
    return this.musicalService.uploadMultipleFilesToCloud(
      req.user.userId,
      files,
    );
  }

  @Post('upload-single-file')
  @UseInterceptors(FileInterceptor('file'))
  async artistProfileSetup(
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    return this.musicalService.uploadFileToCloud(req.user.userId, file);
  }

  @Get('catalog')
  @Roles('artist')
  getArtistCatalog(
    @Req() req,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.musicalService.getArtistCatalog(req.user.userId, page, limit);
  }
}
