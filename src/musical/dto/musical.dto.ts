import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUrl,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GenreEnum } from 'src/enums/track.data.enums';
export class CreateSingleDto {
  @IsString() title: string;
  @IsString() primaryArtist: string;
  @IsOptional() @IsString() featuredArtists?: string;
  @IsBoolean() isJointRelease: boolean;
  @IsEnum(GenreEnum) genre: GenreEnum;
  @IsUrl() coverArt: string;
  @IsOptional() @IsString() recordLabel?: string;
  @IsOptional() @IsString() composer?: string;
  @IsOptional() @IsString() songWriter?: string;
  @IsOptional() @IsString() producer?: string;
  @IsString() trackUrl: string;
  @IsOptional() @IsString() lyrics?: string;
  @IsDateString()
  releaseDate: string;
}

export class CreateProjectDto {
  @IsString() title: string;
  @IsString() primaryArtist: string;
  @IsOptional() @IsString() featuredArtists?: string;
  @IsBoolean() isJointRelease: boolean;
  @IsEnum(GenreEnum) genre: GenreEnum;
  @IsUrl() coverArtUrl: string;
  @IsOptional() @IsString() recordLabel?: string;
  @IsString() type: string;
  @IsDateString()
  releaseDate: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSingleDto)
  tracks: CreateSingleDto[];
}

export class FollowOrUnfollowArtistDto {
  @IsString() artistId: string;
}
