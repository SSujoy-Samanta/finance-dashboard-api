import { Request, Response } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { ApiResponse } from '@/utils/ApiResponse';
import { UserService } from '@/modules/users/user.service';
import { AppError } from '@/utils/AppError';
import { ListUsersQuery } from './user.schema';

export class UserController {
  /**
   * Handles the creation of a new user by an administrator.
   * 
   * @param {Request} req - Express request object containing user data in body.
   * @param {Response} res - Express response object.
   * @throws {AppError} 401 - If the requester is not authenticated.
   */
  static create = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const userAgent = req.headers['user-agent']?.toString();
    const user = await UserService.create(
      req.body,
      req.user.id,
      req.ip || 'unknown',
      userAgent,
    );
    res.status(201).json(ApiResponse.success(user, 'User created'));
  });

  /**
   * Handles requests for a list of all active users with pagination.
   * 
   * @param {Request} req - Express request object with pagination query params.
   * @param {Response} res - Express response object.
   */
  static list = catchAsync(async (req: Request, res: Response) => {
    const { data, meta } = await UserService.list(req.query as unknown as ListUsersQuery);
    res.json(ApiResponse.success(data, undefined, meta));
  });

  /**
   * Handles requests for a single user's details by their ID.
   * 
   * @param {Request} req - Express request object with user ID in params.
   * @param {Response} res - Express response object.
   */
  static getById = catchAsync(async (req: Request, res: Response) => {
    const user = await UserService.getById(req.params.id as string);
    res.json(ApiResponse.success(user));
  });

  /**
   * Handles updating an existing user's information.
   * 
   * @param {Request} req - Express request object with user ID in params and updates in body.
   * @param {Response} res - Express response object.
   * @throws {AppError} 401 - If the requester is not authenticated.
   */
  static update = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const userAgent = req.headers['user-agent']?.toString();
    const user = await UserService.update(
      req.params.id as string,
      req.body,
      req.user.id,
      req.ip || 'unknown',
      userAgent,
    );
    res.json(ApiResponse.success(user, 'User updated'));
  });
}
