import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project } from 'src/models/project.schema';
import { Track, TrackDocument } from 'src/models/track.schema';
import { CreateProjectDto, CreateSingleDto } from './dto/musical.dto';
import { GenreEnum, ProjectTypeEnum } from 'src/enums/track.data.enums';
import { SuccessResponse } from 'src/utils/response.util';
import { StatusCodes } from 'http-status-codes';
import { title } from 'process';
import { UploaderService } from 'src/uploader/uploader.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class MusicalService {
  constructor(
    @InjectModel(Track.name) private readonly singleModel: Model<Track>,
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    private userService: UsersService,
    private uploaderService: UploaderService,
  ) {}

  async uploadSingle(userId: string, dto: CreateSingleDto) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const single = await this.singleModel.create({
      ...dto,
      uploadedBy: userId,
    });

    return SuccessResponse(StatusCodes.OK, 'Single uploaded successfully', {
      title: single.title,
      id: single._id,
      primaryArtist: single.primaryArtist,
      playCount: single.playCount,
      genre: single.genre,
    });
  }

  //   async uploadProject(userId: string, dto: CreateProjectDto) {
  //     const user = await this.userService.findById(userId);
  //     if (!user) throw new NotFoundException('User not found');

  //     const album = await this.projectModel.create({
  //       ...dto,
  //       uploadedBy: userId,
  //       tracks: dto.tracks.map((track) => ({ ...track })),
  //     });

  //     return SuccessResponse(StatusCodes.OK, 'Project uploaded successfully', {
  //       title: album.title,
  //       id: album._id,
  //       primaryArtist: album.primaryArtist,
  //       featuredArtists: album.featuredArtists,
  //       genre: album.genre,
  //       type: album.type,
  //     });
  //   }

  async uploadProject(userId: string, dto: CreateProjectDto) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const trackIds: Types.ObjectId[] = [];

    for (const trackDto of dto.tracks) {
      const createdTrack = await this.singleModel.create({
        ...trackDto,
        uploadedBy: userId,
      });

      trackIds.push(createdTrack.id);
    }

    const album = await this.projectModel.create({
      title: dto.title,
      type: dto.type,
      primaryArtist: dto.primaryArtist,
      featuredArtists: dto.featuredArtists,
      isJointRelease: dto.isJointRelease,
      genre: dto.genre,
      coverArtUrl: dto.coverArtUrl,
      recordLabel: dto.recordLabel,
      uploadedBy: userId,
      tracks: trackIds, // only _id refs go here
    });

    return SuccessResponse(StatusCodes.OK, 'Project uploaded successfully', {
      title: album.title,
      id: album._id,
      primaryArtist: album.primaryArtist,
      featuredArtists: album.featuredArtists,
      genre: album.genre,
      type: album.type,
    });
  }

  async getSingleById(id: string) {
    return await this.singleModel.findById(id).exec();
  }

  async getProjectById(id: string) {
    return await this.projectModel.findById(id).exec();
  }

  async incrementSinglePlay(id: string) {
    const track = await this.singleModel.findById(id);
    if (!track) throw new NotFoundException('Track not found');
    track.playCount += 1;
    await track.save();
    return track;
  }

  //   async incrementProjectTrackPlay(projectId: string, trackIndex: number) {
  //     const project = await this.projectModel.findById(projectId);
  //     if (!project || !project.tracks[trackIndex])
  //       throw new NotFoundException('Track not found');
  //     project.tracks[trackIndex].playCount += 1;
  //     await project.save();
  //     return project.tracks[trackIndex];
  //   }

  async incrementProjectTrackPlay(projectId: string, trackIndex: number) {
    const project = await this.projectModel
      .findById(projectId)
      .populate<{ tracks: TrackDocument[] }>('tracks');
    if (!project || !project.tracks[trackIndex])
      throw new NotFoundException('Track not found');
    const track = project.tracks[trackIndex];
    track.playCount += 1;
    await track.save();

    return track;
  }

  getTrackMetadataOptions() {
    return SuccessResponse(StatusCodes.OK, 'Track metadata options', {
      genres: Object.values(GenreEnum),
      projectTypes: Object.values(ProjectTypeEnum),
    });
  }

  async uploadFileToCloud(userId: string, file: Express.Multer.File) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const { url, key } = await this.uploaderService.uploadFile(file, '');
    console.log('Uploaded file URL:', url);
    return SuccessResponse(StatusCodes.OK, 'File uploaded successfully', {
      url,
    });
  }

  async uploadMultipleFilesToCloud(
    userId: string,
    files: Express.Multer.File[],
  ) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const urls = await this.uploaderService.uploadMultipleFiles(files);
    console.log('Uploaded file URLs:', urls);
    return SuccessResponse(StatusCodes.OK, 'Files uploaded successfully', {
      urls,
    });
  }

  async getArtistCatalog(userId: string, page: number, limit: number) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // Step 1: Get all track IDs used in the user's projects
    const userProjects = await this.projectModel.find(
      { uploadedBy: userId },
      'tracks',
    );
    const projectTrackIds = userProjects.flatMap((project) =>
      project.tracks.map((id) => id.toString()),
    );

    // Step 2: Get tracks uploaded by user that are NOT in those projects
    const singles = await this.singleModel.find({
      uploadedBy: userId,
      _id: { $nin: projectTrackIds },
    });

    // Step 3: Paginate projects and populate tracks
    const projects = await this.projectModel
      .find({ uploadedBy: userId })
      .populate('tracks')
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .exec();

    const totalProjects = await this.projectModel.countDocuments({
      uploadedBy: userId,
    });

    return SuccessResponse(
      StatusCodes.OK,
      'User uploads fetched successfully',
      {
        singles,
        projects: {
          data: projects,
          total: totalProjects,
          currentPage: +page,
          totalPages: Math.ceil(totalProjects / +limit),
        },
      },
    );
  }
}
