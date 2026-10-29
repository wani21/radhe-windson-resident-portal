export interface SocietyAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface SocietySettings {
  maintenanceDueDay: number;
  lateFee: number;
}

export interface Society {
  _id: string;
  name: string;
  registrationNumber?: string;
  address?: SocietyAddress;
  contactEmail?: string;
  contactPhone?: string;
  settings: SocietySettings;
  createdAt: string;
  updatedAt: string;
}

export interface Building {
  _id: string;
  societyId: string;
  name: string;
  totalFloors: number;
  createdAt: string;
  updatedAt: string;
}

export type OccupancyStatus = 'VACANT' | 'OCCUPIED' | 'TENANTED';

export interface Flat {
  _id: string;
  buildingId: {
    _id: string;
    name: string;
    totalFloors: number;
  } | string;
  flatNumber: string;
  floor: number;
  occupancyStatus: OccupancyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FlatsResponse {
  flats: Flat[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
