import { Request, Response, NextFunction } from 'express';
import { buildingService } from './building.service';
import { sendSuccess } from '../../utils/response';

export class BuildingController {
  getAllBuildings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const buildings = await buildingService.getAllBuildings();
      sendSuccess(res, { buildings }, 200, 'Buildings retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getBuildingById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const building = await buildingService.getBuildingById(req.params.id);
      sendSuccess(res, { building }, 200, 'Building details retrieved');
    } catch (error) {
      next(error);
    }
  };

  createBuilding = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const building = await buildingService.createBuilding(req.body);
      sendSuccess(res, { building }, 201, 'Building created successfully');
    } catch (error) {
      next(error);
    }
  };

  updateBuilding = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const building = await buildingService.updateBuilding(req.params.id, req.body);
      sendSuccess(res, { building }, 200, 'Building updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteBuilding = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await buildingService.deleteBuilding(req.params.id);
      sendSuccess(res, null, 200, 'Building archived successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const buildingController = new BuildingController();
