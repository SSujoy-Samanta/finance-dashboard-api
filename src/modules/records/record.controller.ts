import { Request, Response } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { ApiResponse } from '@/utils/ApiResponse';
import { RecordService } from '@/modules/records/record.service';
import { ListRecordsQuery } from '@/modules/records/record.schema';
import { AppError } from '@/utils/AppError';

export class RecordController {
  /**
   * Handles the creation of a new financial record.
   * Extracts metadata (IP, User Agent) and user ID for auditing purposes.
   * 
   * @param {Request} req - Express request object containing the record data.
   * @param {Response} res - Express response object.
   * @throws {AppError} 401 - If the user is not authenticated.
   */
  static create = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const userAgent = req.headers['user-agent']?.toString();
    const record = await RecordService.create(
      req.body,
      req.user.id,
      req.ip || 'unknown',
      userAgent,
    );
    res.status(201).json(ApiResponse.success(record, 'Record created'));
  });

  /**
   * Handles requests for a filtered and paginated list of financial records.
   * 
   * @param {Request} req - Express request object with filter and pagination query params.
   * @param {Response} res - Express response object.
   */
  static list = catchAsync(async (req: Request, res: Response) => {
    const records = await RecordService.list(req.query as unknown as ListRecordsQuery);
    res.json(ApiResponse.success(records.data, undefined, records.meta));
  });

  /**
   * Handles requests for a single financial record by ID.
   * 
   * @param {Request} req - Express request object with the record ID in params.
   * @param {Response} res - Express response object.
   */
  static getById = catchAsync(async (req: Request, res: Response) => {
    const record = await RecordService.getById(req.params.id as string);
    res.json(ApiResponse.success(record));
  });

  /**
   * Handles updating an existing financial record.
   * Captures audit metadata and ensures the requester is authorized.
   * 
   * @param {Request} req - Express request object with the record ID in params and updates in body.
   * @param {Response} res - Express response object.
   * @throws {AppError} 401 - If the user is not authenticated.
   */
  static update = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const userAgent = req.headers['user-agent']?.toString();
    const record = await RecordService.update(
      req.params.id as string,
      req.body,
      req.user.id,
      req.ip || 'unknown',
      userAgent,
    );
    res.json(ApiResponse.success(record, 'Record updated'));
  });

  /**
   * Handles the soft-deletion of a financial record.
   * 
   * @param {Request} req - Express request object with the record ID in params.
   * @param {Response} res - Express response object (204 No Content).
   * @throws {AppError} 401 - If the user is not authenticated.
   */
  static delete = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const userAgent = req.headers['user-agent']?.toString();
    await RecordService.delete(
      req.params.id as string,
      req.user.id,
      req.ip || 'unknown',
      userAgent,
    );
    res.status(204).send();
  });
}
