import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder, Types } from 'mongoose';
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
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationProducerService } from 'src/notifications/notification-producer.service';

@Injectable()
export class MusicalService {
  constructor(
    @InjectModel(Track.name) private readonly singleModel: Model<Track>,
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    @InjectModel(PlayHistory.name)
    private readonly playHistoryModel: Model<PlayHistory>,
    private userService: UsersService,
    private uploaderService: UploaderService,
    private notificationsService: NotificationsService,
    private readonly notificationProducer: NotificationProducerService,
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
      copyright: dto.copyright,
      phonographic: dto.phonographic,
      uploadedBy: userId,
      releaseDate: new Date(dto.releaseDate),
      tracks: trackIds, // only _id refs go here
    });

    await this.notificationsService.createAlbumReleaseNotification(
      userId,
      dto.title,
    );

    // const followers = await this.userService.getFollowers(userId);
    // const artistName = user.stageName || user.username;

    // await Promise.all(
    //   followers.map((follower) =>
    //     this.notificationsService.createReleaseNotification(
    //       follower,
    //       artistName,
    //       dto.title,
    //       'album',
    //     ),
    //   ),
    // );

    const followers = await this.userService.getFollowers(userId);
    const artistName = user.stageName || user.username;

    await this.notificationProducer.queueBulkReleaseNotifications(
      followers,
      artistName,
      dto.title,
      'album',
    );

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

  // async getTopMusicByArtist(userId: string, limit = 10) {
  //   const user = await this.userService.findById(userId);
  //   if (!user) throw new NotFoundException('User not found');

  //   if (user.role !== 'artist') {
  //     throw new BadRequestException('User is not an artist');
  //   }

  //   const projects = await this.projectModel
  //     .find({ uploadedBy: userId })
  //     .populate<{ tracks: TrackDocument[] }>('tracks')
  //     .lean();

  //   // Get all track IDs used in projects
  //   const projectTrackIds = projects.flatMap((p) =>
  //     p.tracks.map((t) => t._id.toString()),
  //   );

  //   // Fetch singles that are NOT part of any project
  //   const topSingles = await this.singleModel
  //     .find({
  //       uploadedBy: userId,
  //       _id: { $nin: projectTrackIds },
  //     })
  //     .sort({ playCount: -1 })
  //     .limit(limit)
  //     .lean();

  //   const topProjectTracks = projects
  //     .flatMap((p) =>
  //       p.tracks.map((t) => ({
  //         ...t,
  //         project: { _id: p._id, title: p.title },
  //       })),
  //     )
  //     .sort((a, b) => b.playCount - a.playCount)
  //     .slice(0, limit);

  //   const totalStreams = [
  //     ...topSingles.map((t) => t.playCount),
  //     ...topProjectTracks.map((t) => t.playCount),
  //   ].reduce((acc, curr) => acc + curr, 0);

  //   return SuccessResponse(StatusCodes.OK, 'Artist top music fetched', {
  //     totalStreams,
  //     topSingles,
  //     topProjectTracks,
  //   });
  // }

  async getTopMusicByArtist(userId: string, limit = 10) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.role !== 'artist') {
      throw new BadRequestException('User is not an artist');
    }

    // Fetch all projects (with tracks)
    const projects = await this.projectModel
      .find({ uploadedBy: userId })
      .populate<{ tracks: TrackDocument[] }>('tracks')
      .lean();

    // Add a playCount field to each project (sum of all track playCounts)
    const projectsWithPlayCounts = projects.map((project) => {
      const projectPlayCount = project.tracks.reduce(
        (acc, track) => acc + (track.playCount || 0),
        0,
      );
      return { ...project, projectPlayCount };
    });

    // Sort by total playCount and take top N
    const topProjects = projectsWithPlayCounts
      .sort((a, b) => b.projectPlayCount - a.projectPlayCount)
      .slice(0, limit);

    // Extract all track IDs used in projects
    const projectTrackIds = topProjects.flatMap((p) =>
      p.tracks.map((t) => t._id.toString()),
    );

    // Fetch singles that are NOT part of any project
    const topSingles = await this.singleModel
      .find({
        uploadedBy: userId,
        _id: { $nin: projectTrackIds },
      })
      .sort({ playCount: -1 })
      .limit(limit)
      .lean();

    // Calculate total streams across both
    const totalStreams =
      topSingles.reduce((acc, t) => acc + (t.playCount || 0), 0) +
      topProjects.reduce((acc, p) => acc + p.projectPlayCount, 0);

    return SuccessResponse(StatusCodes.OK, 'Artist top music fetched', {
      totalStreams,
      topSingles,
      topProjects,
    });
  }

  async getRecentMusicByArtist(userId: string, limit = 10) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.role !== 'artist') {
      throw new BadRequestException('User is not an artist');
    }

    // Get all recent projects with tracks
    const recentProjects = await this.projectModel
      .find({ uploadedBy: userId })
      .populate<{ tracks: TrackDocument[] }>('tracks')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const projectTrackIds = recentProjects.flatMap((p) =>
      p.tracks.map((t) => t._id.toString()),
    );

    // Get recent singles not used in projects
    const recentSingles = await this.singleModel
      .find({
        uploadedBy: userId,
        _id: { $nin: projectTrackIds },
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return SuccessResponse(StatusCodes.OK, 'Artist recent music fetched', {
      recentSingles,
      recentProjects,
    });
  }

  async getTopMusic(limit = 10) {
    const topSingles = await this.singleModel
      .find()
      .sort({ playCount: -1 })
      .limit(limit)
      .lean();

    const projects = await this.projectModel
      .find()
      .populate<{ tracks: TrackDocument[] }>('tracks')
      .lean();

    const topProjectTracks = projects
      .flatMap((p) =>
        p.tracks.map((t) => ({
          ...t,
          project: { _id: p._id, title: p.title },
        })),
      )
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, limit);

    const totalStreams = [
      ...topSingles.map((t) => t.playCount),
      ...topProjectTracks.map((t) => t.playCount),
    ].reduce((acc, curr) => acc + curr, 0);

    return SuccessResponse(StatusCodes.OK, 'Global Top music fetched', {
      totalStreams,
      topSingles,
      topProjectTracks,
    });
  }

  async getRecentMusic(limit = 10) {
    const recentSingles = await this.singleModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const recentProjects = await this.projectModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return SuccessResponse(StatusCodes.OK, 'Global Recent music fetched', {
      recentSingles,
      recentProjects,
    });
  }


  async discoverMusic(userId: string, category: string, page = 1, limit = 20) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const skip = (page - 1) * limit;
    const sortByPopularity: { [key: string]: SortOrder } = { playCount: -1 };

    const GenreMap: Record<string, GenreEnum> = {
      afrobeat: GenreEnum.AFROBEAT,
      pop: GenreEnum.POP,
      hiphop: GenreEnum.HIPHOP,
      'hip-hop': GenreEnum.HIPHOP,
      rnb: GenreEnum.RNB,
      'r&b': GenreEnum.RNB,
      reggae: GenreEnum.REGGAE,
      rock: GenreEnum.ROCK,
      edm: GenreEnum.EDM,
      jazz: GenreEnum.JAZZ,
      gospel: GenreEnum.GOSPEL,
      country: GenreEnum.COUNTRY,
      classical: GenreEnum.CLASSICAL,
      other: GenreEnum.OTHER,
    };

    switch (category.toLowerCase()) {
      case 'for_you':
        if (!user.favoriteGenres || !user.favoriteGenres.length) {
          throw new BadRequestException('User has no preferred genres');
        }

        const userPlayMap = await this.playHistoryModel.aggregate([
          { $match: { user: user._id } },
          {
            $group: {
              _id: '$track',
              userPlayCount: { $sum: 1 },
              lastPlayedAt: { $max: '$lastPlayedAt' },
            },
          },
        ]);

        const userPlayMapObj = Object.fromEntries(
          userPlayMap.map((p) => [p._id.toString(), p.userPlayCount]),
        );

        // FOR SINGLES
        const singleTracks = await this.singleModel
          .find({ genre: { $in: user.favoriteGenres } })
          .lean();

        const enrichedSingles = singleTracks.map((track) => {
          const userPlay = userPlayMapObj[track._id.toString()] || 0;
          const score = userPlay * 2 + (track.playCount || 0);
          return { ...track, score };
        });

        const sortedSingles = enrichedSingles
          .sort((a, b) => b.score - a.score)
          .slice(skip, skip + limit);

        // FOR ALBUMS
        const allProjects = await this.projectModel
          .find({ genre: { $in: user.favoriteGenres } })
          .populate<{ tracks: TrackDocument[] }>('tracks')
          .lean();

        console.log('All projects length:', allProjects.length);

        const playedTrackIds = new Set(Object.keys(userPlayMapObj));

        const scoredProjects = allProjects.map((project) => {
          let score = 0;

          for (const track of project.tracks) {
            const userPlay = userPlayMapObj[track._id.toString()] || 0;
            const popularity = track.playCount || 0;
            score += userPlay * 2 + popularity;
          }

          return { ...project, score };
        });

        console.log('Scored projects length:', scoredProjects.length);

        // Sort all albums by score (those with plays come first), then paginate
        const sortedAlbums = scoredProjects
          .sort((a, b) => b.score - a.score)
          .slice(skip, skip + limit);

        return SuccessResponse(StatusCodes.OK, 'For You music fetched', {
          category: 'for_you',
          results: sortedSingles,
          albums: sortedAlbums,
          totalSingles: enrichedSingles.length,
          totalAlbums: scoredProjects.length,
        });

      case 'all':
        const allSingles = await this.singleModel
          .find()
          .sort(sortByPopularity)
          .skip(skip)
          .limit(limit)
          .lean();

        const allProjectsWithTracks = await this.projectModel
          .find()
          .populate<{ tracks: TrackDocument[] }>('tracks')
          .lean();

        const albumsByPopularity = allProjectsWithTracks
          .map((project) => {
            const score = project.tracks.reduce(
              (acc, t) => acc + (t.playCount || 0),
              0,
            );
            return { ...project, score };
          })
          .sort((a, b) => b.score - a.score)
          .slice(skip, skip + limit);

        return SuccessResponse(StatusCodes.OK, 'All music fetched', {
          category: 'all',
          results: allSingles,
          albums: albumsByPopularity,
        });

      default:
        const normalizedGenre = GenreMap[category.toLowerCase()];
        if (!normalizedGenre) {
          throw new BadRequestException('Invalid genre category');
        }

        const genreSingles = await this.singleModel
          .find({ genre: normalizedGenre })
          .sort(sortByPopularity)
          .skip(skip)
          .limit(limit)
          .lean();

        const genreProjects = await this.projectModel
          .find({ genre: normalizedGenre })
          .populate<{ tracks: TrackDocument[] }>('tracks')
          .lean();

        const genreAlbums = genreProjects
          .map((p) => {
            const score = p.tracks.reduce(
              (acc, t) => acc + (t.playCount || 0),
              0,
            );
            return { ...p, score };
          })
          .sort((a, b) => b.score - a.score)
          .slice(skip, skip + limit);

        return SuccessResponse(
          StatusCodes.OK,
          `Genre: ${category} music fetched`,
          {
            category,
            results: genreSingles,
            albums: genreAlbums,
          },
        );
    }
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
