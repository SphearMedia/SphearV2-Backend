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
import {
  CreateSingleDto,
  CreateProjectDto,
  FollowOrUnfollowArtistDto,
} from './dto/musical.dto';
import { JwtAuthGuard } from 'src/config/jwt-auth.guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Roles, RolesGuard } from 'src/config/roles.guard';
import {
  CreateSingleSchemaValidator,
  CreateProjectSchemaValidator,
  FollowOrUnfollowArtistSchemaValidator,
} from 'src/pipes/input.validators';
import { JoiValidationPipe } from 'src/pipes/joi-validation.pipe';
import { multerConfig } from 'src/uploader/multer.config';

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
    // console.log('DTO Received:', dto);
    return this.musicalService.uploadProject(req.user.userId, dto);
  }

  @Get('single')
  async getSingle(@Query('id') id: string) {
    return this.musicalService.getSingleById(id);
  }

  @Get('project')
  async getProject(@Query('id') id: string) {
    return this.musicalService.getProjectById(id);
  }

  @Patch('single/play')
  async playSingle(@Query('id') id: string, @Req() req) {
    return this.musicalService.incrementSinglePlay(req.user.userId, id);
  }

  @Patch('project/play')
  async playProjectTrack(
    @Query('id') id: string,
    @Query('trackIndex') index: string,
    @Req() req,
  ) {
    return this.musicalService.incrementProjectTrackPlay(
      req.user.userId,
      id,
      parseInt(index),
    );
  }

  @Get('metadata-options')
  getMetadataOptions() {
    return this.musicalService.getTrackMetadataOptions();
  }

  @Post('upload-multiple-files')
  @UseInterceptors(FilesInterceptor('files', 50, multerConfig)) // field name: files[]
  uploadMultiple(@UploadedFiles() files: Express.Multer.File[], @Req() req) {
    return this.musicalService.uploadMultipleFilesToCloud(
      req.user.userId,
      files,
    );
  }

  @Post('upload-single-file')
  @UseInterceptors(FileInterceptor('file', multerConfig))
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

  @Patch('followOrUnfollow')
  @Roles('user')
  followOrUnfollowArtist(
    @Req() req,
    @Body(new JoiValidationPipe(FollowOrUnfollowArtistSchemaValidator))
    dto: FollowOrUnfollowArtistDto,
  ) {
    return this.musicalService.followOrUnfollowArtist(
      req.user.userId,
      dto.artistId,
    );
  }

  @Get('recent-plays')
  getUserRecentPlays(@Req() req) {
    return this.musicalService.getUserRecentPlays(req.user.userId);
  }

  @Get('artist-top')
  getArtistTopMusic(@Req() req) {
    return this.musicalService.getTopMusicByArtist(req.user.userId);
  }

  @Get('artist-recent')
  async getArtistRecentMusic(@Req() req) {
    return this.musicalService.getRecentMusicByArtist(req.user.userId);
  }

  @Get('top-streams')
  async getTopMusic(@Query('page') page = '1', @Query('limit') limit = '10') {
    const parsedPage = Math.max(Number(page), 1);
    const parsedLimit = Math.min(Math.max(Number(limit), 1), 100);
    return this.musicalService.getTopMusic(parsedPage, parsedLimit);
  }

  @Get('recent-uploads')
  async getRecentMusic(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const parsedPage = Math.max(Number(page), 1);
    const parsedLimit = Math.min(Math.max(Number(limit), 1), 100);
    return this.musicalService.getRecentMusic(parsedPage, parsedLimit);
  }

  @Get('discover')
  async discoverMusic(
    @Query('category') category: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Req() req,
  ) {
    return this.musicalService.discoverMusic(
      req.user.userId,
      category,
      +page,
      +limit,
    );
  }
}
