import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'SOCIETY_ADMIN' | 'COMMITTEE_MEMBER' | 'SECURITY' | 'RESIDENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface IUser extends Document {
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  tokenVersion: number;
  phone?: string;
  flatId?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Security: Never return passwordHash in standard queries
    },
    role: {
      type: String,
      enum: {
        values: ['SOCIETY_ADMIN', 'COMMITTEE_MEMBER', 'SECURITY', 'RESIDENT'],
        message: '{VALUE} is not a valid user role',
      },
      required: [true, 'Role is required'],
      default: 'RESIDENT',
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'INACTIVE'],
        message: '{VALUE} is not a valid account status',
      },
      default: 'ACTIVE',
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    flatId: {
      type: Schema.Types.ObjectId,
      ref: 'Flat',
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for query performance and integrity
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ flatId: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
