import { Router } from 'express';
import { DashboardController } from '@/modules/dashboard/dashboard.controller';
import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';
import { validate } from '@/middlewares/validate';
import { standardLimiter } from '@/middlewares/ratelimit/standard';
import { getTrendsSchema, getRecentSchema } from '@/modules/dashboard/dashboard.schema';

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Analytics and summary metrics
 */

const router:Router = Router();

// Rate limiting for dashboard metrics
router.use(standardLimiter);

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     summary: Get dashboard summary metrics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalIncome:
 *                       type: number
 *                     totalExpenses:
 *                       type: number
 *                     netSavings:
 *                       type: number
 *                     recentPercentageChange:
 *                       type: number
 */

/**
 * Authentication middleware.
 * Verifies JWT token and attaches user to request.
 * 
 * Applied to all routes in this router.
 * 
 * @throws {AppError} 401 - If token is missing or invalid
 */
router.use(authenticate);

/**
 * Authorization middleware.
 * Checks if user has 'dashboard:read' permission.
 * 
 * Applied to all routes in this router.
 * 
 * @throws {AppError} 403 - If user lacks required permission
 */
router.use(authorize('dashboard:read'));

/**
 * Get dashboard summary endpoint.
 * 
 * Authentication:
 * - Requires valid authentication
 * 
 * Authorization:
 * - Requires 'dashboard:read' permission
 * 
 * Response:
 * - 200 OK: Dashboard summary with key metrics
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Insufficient permissions
 */
router.get('/summary', DashboardController.getSummary);

/**
 * @swagger
 * /dashboard/by-category:
 *   get:
 *     summary: Get dashboard data grouped by category
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       type:
 *                         type: string
 */

/**
 * Get dashboard data by category endpoint.
 * 
 * Response:
 * - 200 OK: Dashboard data grouped by category
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Insufficient permissions
 */
router.get('/by-category', DashboardController.getByCategory);

/**
 * @swagger
 * /dashboard/trends:
 *   get:
 *     summary: Get financial trends over time
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trends data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       income:
 *                         type: number
 *                       expenses:
 *                         type: number
 */

/**
 * Get dashboard trends endpoint.
 * 
 * Response:
 * - 200 OK: Dashboard trends data
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Insufficient permissions
 */
router.get('/trends', validate(getTrendsSchema), DashboardController.getTrends);

/**
 * @swagger
 * /dashboard/recent:
 *   get:
 *     summary: Get most recent financial records
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FinancialRecord'
 */
router.get('/recent', validate(getRecentSchema), DashboardController.getRecent);

export default router;
