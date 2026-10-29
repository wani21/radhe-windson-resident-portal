import mongoose, { Document, Schema } from 'mongoose';

export interface IBuilding extends Document {
  societyId: mongoose.Types.ObjectId;
  name: string;
  totalFloors: number;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const BuildingSchema = new Schema<IBuilding>(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Building or wing name is required'],
      trim: true,
      minlength: [1, 'Building name must be at least 1 character'],
      maxlength: [50, 'Building name cannot exceed 50 characters'],
    },
    totalFloors: {
      type: Number,
      required: [true, 'Total floors is required'],
      min: [1, 'A building must have at least 1 floor'],
      max: [100, 'Total floors cannot exceed 100'],
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

// Compound unique index ensuring building name uniqueness within the society (among non-deleted records)
BuildingSchema.index(
  { societyId: 1, name: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const Building = mongoose.model<IBuilding>('Building', BuildingSchema);
