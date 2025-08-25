import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../models/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /** Register user with password hashing */
  async createUser(userData: {
    email: string;
    username: string;
    fullName: string;
    password: string;
  }): Promise<User> {
    const existing = await this.userModel.findOne({
      $or: [{ email: userData.email }, { username: userData.username }],
    });
    if (existing) {
      throw new ConflictException('Email or username already in use');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = new this.userModel({
      ...userData,
      password: hashedPassword,
    });

    return user.save();
  }

  /** Validate password login */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email }).select('+password');
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? user : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findById(userId: string): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, update: Partial<User>): Promise<User> {
    const updated = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true },
    );
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  /** Get all users (optional for admin use) */
  async getAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  /** Soft delete (could also permanently delete) */
  async deleteUser(userId: string): Promise<void> {
    const deleted = await this.userModel.findByIdAndDelete(userId);
    if (!deleted) throw new NotFoundException('User not found');
  }
}
