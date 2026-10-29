import mongoose, { Document, Schema } from 'mongoose';

export type OccupancyStatus = 'VACANT' | 'OCCUPIED' | 'TENANTED';

export interface IFlat extends Document {
  buildingId: mongoose.Types.ObjectId;
  flatNumber: string;
  floor: number;
  occupancyStatus: OccupancyStatus;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const FlatSchema = new Schema<IFlat>(
  {
    buildingId: {
      type: Schema.Types.ObjectId,
      ref: 'Building',
      required: [true, 'Building reference is required'],
      index: true,
    },
    flatNumber: {
      type: String,
      required: [true, 'Flat number is required'],
      trim: true,
      uppercase: true,
      minlength: [1, 'Flat number cannot be empty'],
      maxlength: [20, 'Flat number cannot exceed 20 characters'],
    },
    floor: {
      type: Number,
      required: [true, 'Floor number is required'],
      min: [0, 'Floor number cannot be negative'],
    },
    occupancyStatus: {
      type: String,
      enum: {
        values: ['VACANT', 'OCCUPIED', 'TENANTED'],
        message: '{VALUE} is not a valid occupancy status',
      },
      default: 'VACANT',
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

// Compound Unique Index: Prevents duplicate flat numbers within the same building
FlatSchema.index(
  { buildingId: 1, flatNumber: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

// Query optimization index for building & occupancy filters
FlatSchema.index({ buildingId: 1, occupancyStatus: 1 });

export const Flat = mongoose.model<IFlat>('Flat', FlatSchema);
