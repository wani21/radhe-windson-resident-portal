import { Request, Response, NextFunction } from 'express';
import { societyService } from './society.service';
import { sendSuccess } from '../../utils/response';

export class SocietyController {
  getSociety = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const society = await societyService.getSociety();
      sendSuccess(res, { society }, 200, 'Society profile retrieved');
    } catch (error) {
      next(error);
    }
  };

  createSociety = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const society = await societyService.createSociety(req.body);
      sendSuccess(res, { society }, 201, 'Society initialized successfully');
    } catch (error) {
      next(error);
    }
  };

  updateSociety = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const society = await societyService.updateSociety(req.body);
      sendSuccess(res, { society }, 200, 'Society configuration updated successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const societyController = new SocietyController();
