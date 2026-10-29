import mongoose, { Document, Schema } from 'mongoose';

export type ResidentCategory = 'OWNER' | 'TENANT' | 'FAMILY_MEMBER';
export type ResidencyStatus = 'ACTIVE' | 'INACTIVE';

export interface IResident extends Document {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  flatId: mongoose.Types.ObjectId;
  residentCategory: ResidentCategory;
  isOccupant: boolean;
  relationshipToPrimaryResident?: string | null;
  residencyStatus: ResidencyStatus;
  moveInDate?: Date;
  moveOutDate?: Date;
  userId?: mongoose.Types.ObjectId | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ResidentSchema = new Schema<IResident>(
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
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters'],
      default: null,
    },
    flatId: {
      type: Schema.Types.ObjectId,
      ref: 'Flat',
      required: [true, 'Flat reference is required'],
      index: true,
    },
    residentCategory: {
      type: String,
      enum: {
        values: ['OWNER', 'TENANT', 'FAMILY_MEMBER'],
        message: '{VALUE} is not a valid resident category',
      },
      required: [true, 'Resident category is required'],
    },
    isOccupant: {
      type: Boolean,
      default: false,
    },
    relationshipToPrimaryResident: {
      type: String,
      trim: true,
      maxlength: [50, 'Relationship description cannot exceed 50 characters'],
      default: null,
    },
    residencyStatus: {
      type: String,
      enum: {
        values: ['ACTIVE', 'INACTIVE'],
        message: '{VALUE} is not a valid residency status',
      },
      default: 'ACTIVE',
    },
    moveInDate: {
      type: Date,
      default: null,
    },
    moveOutDate: {
      type: Date,
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

// Index for querying active residents within a flat
ResidentSchema.index({ flatId: 1, residencyStatus: 1 });

// Index for filtering residents by residency status
ResidentSchema.index({ residencyStatus: 1 });

// Sparse index for account-linking lookups (only on documents with userId set)
ResidentSchema.index({ userId: 1 }, { sparse: true });

export const Resident = mongoose.model<IResident>('Resident', ResidentSchema);
