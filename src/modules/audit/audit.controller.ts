import { Request, Response } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { ApiResponse } from '@/utils/ApiResponse';
import { AuditService } from '@/modules/audit/audit.service';
import { getPaginationMeta } from '@/utils/pagination';

/**
 * Controller for handling audit log operations.
 * Provides endpoints for retrieving audit logs with filtering and pagination.
 */
export class AuditController {
  /**
   * Retrieves audit logs based on specified filters.
   * Supports filtering by user ID, entity type, entity ID, page, and limit.
   * 
   * @param {Request} req - Express request object containing query parameters for filtering.
   * @param {Response} res - Express response object.
   */
  static getLogs = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const { logs, total } = await AuditService.getLogs({
      userId: req.query.userId as string,
      entity: req.query.entity as string,
      entityId: req.query.entityId as string,
      page,
      limit,
    });

    res.json(
      ApiResponse.success(
        logs,
        undefined,
        getPaginationMeta(page, limit, total),
      ),
    );
  });
}
