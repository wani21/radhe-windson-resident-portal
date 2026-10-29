export type ResidentCategory = 'OWNER' | 'TENANT' | 'FAMILY_MEMBER';
export type ResidencyStatus = 'ACTIVE' | 'INACTIVE';

export interface ResidentFlat {
  _id: string;
  flatNumber: string;
  floor: number;
  occupancyStatus: string;
  buildingId: {
    _id: string;
    name: string;
    totalFloors: number;
  } | string;
}

export interface Resident {
  _id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  flatId: ResidentFlat | string;
  residentCategory: ResidentCategory;
  isOccupant: boolean;
  relationshipToPrimaryResident?: string | null;
  residencyStatus: ResidencyStatus;
  moveInDate?: string | null;
  moveOutDate?: string | null;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResidentsResponse {
  residents: Resident[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
