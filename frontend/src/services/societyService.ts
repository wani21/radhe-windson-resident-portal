import { api } from './api';
import { Society, Building, Flat, FlatsResponse } from '../types/society';

export const societyService = {
  // Society
  async getSociety(): Promise<Society> {
    const res = await api.get<{ success: boolean; data: { society: Society } }>('/society');
    return res.data.data.society;
  },

  async updateSociety(data: Partial<Society>): Promise<Society> {
    const res = await api.patch<{ success: boolean; data: { society: Society } }>('/society', data);
    return res.data.data.society;
  },

  // Buildings / Wings
  async getBuildings(): Promise<Building[]> {
    const res = await api.get<{ success: boolean; data: { buildings: Building[] } }>('/buildings');
    return res.data.data.buildings;
  },

  async createBuilding(data: { name: string; totalFloors: number }): Promise<Building> {
    const res = await api.post<{ success: boolean; data: { building: Building } }>('/buildings', data);
    return res.data.data.building;
  },

  async updateBuilding(id: string, data: { name?: string; totalFloors?: number }): Promise<Building> {
    const res = await api.patch<{ success: boolean; data: { building: Building } }>(`/buildings/${id}`, data);
    return res.data.data.building;
  },

  async deleteBuilding(id: string): Promise<void> {
    await api.delete(`/buildings/${id}`);
  },

  // Flats
  async getFlats(params?: {
    buildingId?: string;
    floor?: number;
    occupancyStatus?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<FlatsResponse> {
    const res = await api.get<{
      success: boolean;
      data: { flats: Flat[] };
      meta: FlatsResponse['meta'];
    }>('/flats', { params });
    return {
      flats: res.data.data.flats,
      meta: res.data.meta,
    };
  },

  async createFlat(data: {
    buildingId: string;
    flatNumber: string;
    floor: number;
    occupancyStatus?: string;
  }): Promise<Flat> {
    const res = await api.post<{ success: boolean; data: { flat: Flat } }>('/flats', data);
    return res.data.data.flat;
  },

  async updateFlat(
    id: string,
    data: {
      flatNumber?: string;
      floor?: number;
      occupancyStatus?: string;
    }
  ): Promise<Flat> {
    const res = await api.patch<{ success: boolean; data: { flat: Flat } }>(`/flats/${id}`, data);
    return res.data.data.flat;
  },

  async deleteFlat(id: string): Promise<void> {
    await api.delete(`/flats/${id}`);
  },
};
