import { Request, Response, NextFunction } from 'express';
import { residentService } from './resident.service';
import { sendSuccess } from '../../utils/response';

export class ResidentController {
  getResidents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { residents, meta } = await residentService.getResidents(req.query as any);
      sendSuccess(res, { residents }, 200, 'Residents retrieved successfully', meta);
    } catch (error) {
      next(error);
    }
  };

  getResidentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resident = await residentService.getResidentById(req.params.id);
      sendSuccess(res, { resident }, 200, 'Resident details retrieved');
    } catch (error) {
      next(error);
    }
  };

  getResidentsByFlat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const residents = await residentService.getResidentsByFlat(req.params.flatId);
      sendSuccess(res, { residents }, 200, 'Flat residents retrieved');
    } catch (error) {
      next(error);
    }
  };

  createResident = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resident = await residentService.createResident(req.body);
      sendSuccess(res, { resident }, 201, 'Resident registered successfully');
    } catch (error) {
      next(error);
    }
  };

  updateResident = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resident = await residentService.updateResident(req.params.id, req.body);
      sendSuccess(res, { resident }, 200, 'Resident updated successfully');
    } catch (error) {
      next(error);
    }
  };

  moveOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resident = await residentService.moveOut(req.params.id, req.body);
      sendSuccess(res, { resident }, 200, 'Resident moved out successfully');
    } catch (error) {
      next(error);
    }
  };

  reassign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resident = await residentService.reassign(req.params.id, req.body);
      sendSuccess(res, { resident }, 200, 'Resident reassigned to new flat successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteResident = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await residentService.deleteResident(req.params.id);
      sendSuccess(res, null, 200, 'Resident record archived successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const residentController = new ResidentController();
