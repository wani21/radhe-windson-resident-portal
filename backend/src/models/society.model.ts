import mongoose, { Document, Schema } from 'mongoose';

export interface ISocietyAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface ISocietySettings {
  maintenanceDueDay: number;
  lateFee: number;
}

export interface ISociety extends Document {
  name: string;
  registrationNumber?: string;
  address?: ISocietyAddress;
  contactEmail?: string;
  contactPhone?: string;
  settings: ISocietySettings;
  createdAt: Date;
  updatedAt: Date;
}

const SocietySchema = new Schema<ISociety>(
  {
    name: {
      type: String,
      required: [true, 'Society name is required'],
      trim: true,
      minlength: [2, 'Society name must be at least 2 characters'],
      maxlength: [150, 'Society name cannot exceed 150 characters'],
    },
    registrationNumber: {
      type: String,
      trim: true,
      default: null,
    },
    address: {
      street: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      postalCode: { type: String, trim: true, default: '' },
    },
    contactEmail: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid contact email address'],
      default: null,
    },
    contactPhone: {
      type: String,
      trim: true,
      default: null,
    },
    settings: {
      maintenanceDueDay: {
        type: Number,
        required: true,
        min: [1, 'Maintenance due day must be between 1 and 28'],
        max: [28, 'Maintenance due day must be between 1 and 28'],
        default: 5,
      },
      lateFee: {
        type: Number,
        required: true,
        min: [0, 'Late fee cannot be negative'],
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Society = mongoose.model<ISociety>('Society', SocietySchema);
