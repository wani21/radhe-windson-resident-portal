import { api } from './api';
import { Resident, ResidentsResponse } from '../types/resident';

export const residentService = {
  async getResidents(params?: {
    flatId?: string;
    buildingId?: string;
    category?: string;
    residencyStatus?: string;
    isOccupant?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ResidentsResponse> {
    const res = await api.get<{
      success: boolean;
      data: { residents: Resident[] };
      meta: ResidentsResponse['meta'];
    }>('/residents', { params });
    return {
      residents: res.data.data.residents,
      meta: res.data.meta,
    };
  },

  async getResidentById(id: string): Promise<Resident> {
    const res = await api.get<{ success: boolean; data: { resident: Resident } }>(
      `/residents/${id}`
    );
    return res.data.data.resident;
  },

  async getResidentsByFlat(flatId: string): Promise<Resident[]> {
    const res = await api.get<{ success: boolean; data: { residents: Resident[] } }>(
      `/flats/${flatId}/residents`
    );
    return res.data.data.residents;
  },

  async createResident(data: {
    fullName: string;
    email?: string;
    phone?: string;
    flatId: string;
    residentCategory: string;
    isOccupant?: boolean;
    relationshipToPrimaryResident?: string;
    moveInDate?: string;
  }): Promise<Resident> {
    const res = await api.post<{ success: boolean; data: { resident: Resident } }>(
      '/residents',
      data
    );
    return res.data.data.resident;
  },

  async updateResident(
    id: string,
    data: {
      fullName?: string;
      email?: string;
      phone?: string;
      residentCategory?: string;
      isOccupant?: boolean;
      relationshipToPrimaryResident?: string;
      moveInDate?: string;
    }
  ): Promise<Resident> {
    const res = await api.patch<{ success: boolean; data: { resident: Resident } }>(
      `/residents/${id}`,
      data
    );
    return res.data.data.resident;
  },

  async moveOut(id: string, moveOutDate?: string): Promise<Resident> {
    const res = await api.post<{ success: boolean; data: { resident: Resident } }>(
      `/residents/${id}/move-out`,
      moveOutDate ? { moveOutDate } : {}
    );
    return res.data.data.resident;
  },

  async reassign(id: string, newFlatId: string): Promise<Resident> {
    const res = await api.post<{ success: boolean; data: { resident: Resident } }>(
      `/residents/${id}/reassign`,
      { newFlatId }
    );
    return res.data.data.resident;
  },

  async deleteResident(id: string): Promise<void> {
    await api.delete(`/residents/${id}`);
  },
};
