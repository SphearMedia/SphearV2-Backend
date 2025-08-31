import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { PlayHistory } from 'src/models/play.history.schema';

@Injectable()
export class MusicalService {
  constructor(
    @InjectModel(Track.name) private readonly singleModel: Model<Track>,
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    @InjectModel(PlayHistory.name)
    private readonly playHistoryModel: Model<PlayHistory>,
    private userService: UsersService,
    private uploaderService: UploaderService,
  ) {}

  async uploadSingle(userId: string, dto: CreateSingleDto) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const single = await this.singleModel.create({
      ...dto,
      uploadedBy: userId,
      releaseDate: new Date(dto.releaseDate),
    });

    return SuccessResponse(StatusCodes.OK, 'Single uploaded successfully', {
      title: single.title,
      id: single._id,
      primaryArtist: single.primaryArtist,
      playCount: single.playCount,
      genre: single.genre,
    });
  }

  async uploadProject(userId: string, dto: CreateProjectDto) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const trackIds: Types.ObjectId[] = [];

    for (const trackDto of dto.tracks) {
      const createdTrack = await this.singleModel.create({
        ...trackDto,
        uploadedBy: userId,
        releaseDate: new Date(trackDto.releaseDate),
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
      eleaseDate: new Date(dto.releaseDate),
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
    const single = await this.singleModel.findById(id).exec();

    if (!single) throw new NotFoundException('Single not found');

    return SuccessResponse(StatusCodes.OK, 'Single fetched successfully', {
      single,
    });
  }

  async getProjectById(id: string) {
    const album = await this.projectModel.findById(id).exec();

    if (!album) throw new NotFoundException('Project not found');

    return SuccessResponse(StatusCodes.OK, 'Project fetched successfully', {
      album,
    });
  }

  async incrementSinglePlay(userId: string, id: string) {
    const track = await this.singleModel.findById(id);
    if (!track) throw new NotFoundException('Track not found');

    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    let history = await this.playHistoryModel.findOne({
      user: user._id,
      track: track._id,
      project: null,
    });

    const shouldIncrementPlayCount =
      !history || !this.isRepeatWithinThreshold(history.lastPlayedAt, 10);

    if (shouldIncrementPlayCount) {
      track.playCount += 1;
      await track.save();

      if (history) {
        history.playCount += 1;
        history.lastPlayedAt = new Date();
        await history.save();
      } else {
        // Save play history
        await this.playHistoryModel.create({
          user: user._id,
          track: track._id,
          playCount: 1,
          lastPlayedAt: new Date(),
        });
      }
    }

    return SuccessResponse(StatusCodes.OK, 'Track play count incremented', {
      playCount: track.playCount,
    });
  }

  async incrementProjectTrackPlay(
    userId: string,
    projectId: string,
    trackIndex: number,
  ) {
    const project = await this.projectModel
      .findById(projectId)
      .populate<{ tracks: TrackDocument[] }>('tracks');
    if (!project || !project.tracks[trackIndex])
      throw new NotFoundException('Track not found');

    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const track = project.tracks[trackIndex];

    let history = await this.playHistoryModel.findOne({
      user: user._id,
      track: track._id,
      project: project._id,
    });

    const shouldIncrementPlayCount =
      !history || !this.isRepeatWithinThreshold(history.lastPlayedAt, 10);

    if (shouldIncrementPlayCount) {
      track.playCount += 1;
      await track.save();

      if (history) {
        history.playCount += 1;
        history.lastPlayedAt = new Date();
        await history.save();
      } else {
        await this.playHistoryModel.create({
          user: user._id,
          track: track._id,
          project: project._id,
          playCount: 1,
          lastPlayedAt: new Date(),
        });
      }
    }

    return SuccessResponse(
      StatusCodes.OK,
      'Album Track play count incremented',
      {
        playCount: track.playCount,
      },
    );
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
    const singles = await this.singleModel
      .find({
        uploadedBy: userId,
        _id: { $nin: projectTrackIds },
      })
      .sort({ createdAt: -1 });

    // Step 3: Paginate projects and populate tracks
    const projects = await this.projectModel
      .find({ uploadedBy: userId })
      .populate('tracks')
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .sort({ createdAt: -1 })
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

  async followOrUnfollowArtist(currentUserId: string, targetArtistId: string) {
    if (currentUserId === targetArtistId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const currentUser = await this.userService.findById(currentUserId);
    if (!currentUser) throw new NotFoundException('User not found');

    const targetArtist = await this.userService.findById(targetArtistId);
    if (!targetArtist || targetArtist.role !== 'artist') {
      throw new NotFoundException('Artist not found');
    }

    const isFollowing = currentUser.following.includes(targetArtist.id);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetArtist.id.toString(),
      );
      targetArtist.followers = targetArtist.followers.filter(
        (id) => id.toString() !== currentUser.id.toString(),
      );
    } else {
      // Follow
      currentUser.following.push(targetArtist.id);
      targetArtist.followers.push(currentUser.id);
    }

    await currentUser.save();
    await targetArtist.save();

    return SuccessResponse(
      StatusCodes.OK,
      isFollowing ? 'Unfollowed artist' : 'Followed artist',
      {
        isFollowing: !isFollowing,
        currentUser: {
          id: currentUser.id,
          followingCount: currentUser.following.length,
        },
        targetArtist: {
          id: targetArtist.id,
          followersCount: targetArtist.followers.length,
        },
      },
    );
  }

  async getUserRecentPlays(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const recentPlays = await this.playHistoryModel
      .find({ user: user._id })
      .sort({ lastPlayedAt: -1 })
      .limit(30)
      .populate('track project');
    return SuccessResponse(StatusCodes.OK, 'Recent plays fetched', {
      recentPlays,
    });
  }

  private isRepeatWithinThreshold(
    lastPlayed: Date,
    thresholdMins = 10,
  ): boolean {
    const diffMs = Date.now() - new Date(lastPlayed).getTime();
    const diffMinutes = diffMs / (1000 * 60);
    return diffMinutes < thresholdMins;
  }
}
