import { Request, Response, NextFunction } from 'express';
import { flatService } from './flat.service';
import { sendSuccess } from '../../utils/response';

export class FlatController {
  getFlats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { flats, meta } = await flatService.getFlats(req.query as any);
      sendSuccess(res, { flats }, 200, 'Flats retrieved successfully', meta);
    } catch (error) {
      next(error);
    }
  };

  getFlatById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const flat = await flatService.getFlatById(req.params.id);
      sendSuccess(res, { flat }, 200, 'Flat details retrieved');
    } catch (error) {
      next(error);
    }
  };

  createFlat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const flat = await flatService.createFlat(req.body);
      sendSuccess(res, { flat }, 201, 'Flat registered successfully');
    } catch (error) {
      next(error);
    }
  };

  updateFlat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const flat = await flatService.updateFlat(req.params.id, req.body);
      sendSuccess(res, { flat }, 200, 'Flat updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteFlat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await flatService.deleteFlat(req.params.id);
      sendSuccess(res, null, 200, 'Flat archived successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const flatController = new FlatController();
