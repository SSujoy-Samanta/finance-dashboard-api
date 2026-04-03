import { Router } from 'express';
import { AuditController } from '@/modules/audit/audit.controller';
import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';
import { standardLimiter } from '@/middlewares/ratelimit/standard';

/**
 * @swagger
 * tags:
 *   name: Audit
 *   description: Audit log viewing and tracking
 */

const router:Router = Router();

// Rate limiting for audit log access
router.use(standardLimiter);

/**
 * @swagger
 * /audit:
 *   get:
 *     summary: Get system audit logs
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
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
 *                       id:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       action:
 *                         type: string
 *                       entity:
 *                         type: string
 *                       entityId:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
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
 * Checks if user has 'audit:read' permission.
 * 
 * Applied to all routes in this router.
 * 
 * @throws {AppError} 403 - If user lacks required permission
 */
router.use(authorize('audit:read'));

/**
 * Get audit logs endpoint.
 * 
 * Authentication:
 * - Requires valid authentication
 * 
 * Authorization:
 * - Requires 'audit:read' permission
 * 
 * Query Parameters:
 * - userId: Filter by user ID
 * - entityType: Filter by entity type (USER, RECORD)
 * - entityId: Filter by entity ID
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * 
 * Response:
 * - 200 OK: Audit logs with pagination metadata
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Insufficient permissions
 */
router.get('/', AuditController.getLogs);

export default router;
