import { Request, Response } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { ApiResponse } from '@/utils/ApiResponse';
import { DashboardService } from '@/modules/dashboard/dashboard.service';

export class DashboardController {
  /**
   * Handles requests for the high-level financial summary.
   * Returns aggregated totals for income, expenses, and net balance.
   * 
   * @param {Request} _req - Express request object.
   * @param {Response} res - Express response object.
   */
  static getSummary = catchAsync(async (_req: Request, res: Response) => {
    const summary = await DashboardService.getSummary();
    res.json(ApiResponse.success(summary));
  });

  /**
   * Handles requests for financial totals grouped by category.
   * Returns a list of categories with their respective income/expense sums.
   * 
   * @param {Request} _req - Express request object.
   * @param {Response} res - Express response object.
   */
  static getByCategory = catchAsync(async (_req: Request, res: Response) => {
    const byCategory = await DashboardService.getByCategory();
    res.json(ApiResponse.success(byCategory));
  });

  /**
   * Handles requests for time-series financial trends.
   * Supports monthly and weekly aggregation for a specified year.
   * 
   * @param {Request} req - Express request object with 'period' and 'year' in query.
   * @param {Response} res - Express response object.
   */
  static getTrends = catchAsync(async (req: Request, res: Response) => {
    const period = (req.query.period as 'monthly' | 'weekly') || 'monthly';
    const year = Number(req.query.year) || new Date().getFullYear();
    const trends = await DashboardService.getTrends(period, year);
    res.json(ApiResponse.success(trends));
  });

  /**
   * Handles requests for a list of the most recent financial activities.
   * 
   * @param {Request} req - Express request object with optional 'limit' in query.
   * @param {Response} res - Express response object.
   */
  static getRecent = catchAsync(async (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 5;
    const recent = await DashboardService.getRecent(limit);
    res.json(ApiResponse.success(recent));
  });
}
