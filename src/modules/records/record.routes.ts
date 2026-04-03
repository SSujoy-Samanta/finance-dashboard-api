import { Router } from 'express';
import { RecordController } from '@/modules/records/record.controller';
import { validate } from '@/middlewares/validate';
import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';
import { standardLimiter } from '@/middlewares/ratelimit/standard';
import {
  createRecordSchema,
  updateRecordSchema,
  getRecordSchema,
  listRecordsSchema,
} from '@/modules/records/record.schema';

/**
 * @swagger
 * tags:
 *   name: Records
 *   description: Financial records management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FinancialRecord:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         amount:
 *           type: number
 *         type:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *         category:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         notes:
 *           type: string
 *         reference:
 *           type: string
 *         createdById:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

const router:Router = Router();

// Rate limiting for financial records access
router.use(standardLimiter);

/**
 * @swagger
 * /records:
 *   post:
 *     summary: Create a new financial record
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - type
 *               - category
 *               - date
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *               reference:
 *                 type: string
 *     responses:
 *       201:
 *         description: Record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/FinancialRecord'
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
 * Create financial record endpoint.
 * 
 * Authentication:
 * - Requires valid authentication
 * 
 * Authorization:
 * - Requires 'record:create' permission
 * 
 * Validation:
 * - Validates request body using createRecordSchema
 * 
 * Response:
 * - 201 Created: Record created successfully
 * - 400 Bad Request: Invalid request data
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Insufficient permissions
 */
router.post(
  '/',
  authorize('record:create'),
  validate(createRecordSchema),
  RecordController.create,
);

/**
 * List financial records endpoint.
 * 
 * Authentication:
 * - Requires valid authentication
 * 
 * Authorization:
 * - Requires 'record:read' permission
 * 
 * Validation:
 * - Validates query parameters using listRecordsSchema
 * 
 * Response:
 * - 200 OK: List of financial records with pagination metadata
 * - 400 Bad Request: Invalid query parameters
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Insufficient permissions
 */
router.get(
  '/',
  authorize('record:read'),
  validate(listRecordsSchema),
  RecordController.list,
);

/**
 * @swagger
 * /records:
 *   get:
 *     summary: List financial records
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [amount, date, createdAt]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of records retrieved successfully
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
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         totalPages:
 *           type: integer
 *         hasNextPage:
 *           type: boolean
 *         hasPrevPage:
 *           type: boolean
 */

/**
 * Get financial record by ID endpoint.
 * 
 * Authentication:
 * - Requires valid authentication
 * 
 * Authorization:
 * - Requires 'record:read' permission
 * 
 * Validation:
 * - Validates record ID parameter using getRecordSchema
 * 
 * Response:
 * - 200 OK: Financial record data
 * - 400 Bad Request: Invalid record ID
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Insufficient permissions
 * - 404 Not Found: Record not found
 */
router.get(
  '/:id',
  authorize('record:read'),
  validate(getRecordSchema),
  RecordController.getById,
);

/**
 * @swagger
 * /records/{id}:
 *   get:
 *     summary: Get financial record by ID
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/FinancialRecord'
 *       404:
 *         description: Record not found
 */

/**
 * Update financial record endpoint.
 * 
 * Authentication:
 * - Requires valid authentication
 * 
 * Authorization:
 * - Requires 'record:update' permission
 * 
 * Validation:
 * - Validates record ID parameter using getRecordSchema
 * - Validates request body using updateRecordSchema
 * 
 * Response:
 * - 200 OK: Updated financial record data
 * - 400 Bad Request: Invalid request data
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Insufficient permissions
 * - 404 Not Found: Record not found
 */
router.patch(
  '/:id',
  authorize('record:update'),
  validate(updateRecordSchema),
  RecordController.update,
);

/**
 * @swagger
 * /records/{id}:
 *   patch:
 *     summary: Update a financial record
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *               reference:
 *                 type: string
 *     responses:
 *       200:
 *         description: Record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/FinancialRecord'
 *       404:
 *         description: Record not found
 */

/**
 * Delete financial record endpoint.
 * 
 * Authentication:
 * - Requires valid authentication
 * 
 * Authorization:
 * - Requires 'record:delete' permission
 * 
 * Validation:
 * - Validates record ID parameter using getRecordSchema
 * 
 * Response:
 * - 204 No Content: Record deleted successfully
 * - 400 Bad Request: Invalid record ID
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Insufficient permissions
 * - 404 Not Found: Record not found
 */
router.delete(
  '/:id',
  authorize('record:delete'),
  validate(getRecordSchema),
  RecordController.delete,
);

/**
 * @swagger
 * /records/{id}:
 *   delete:
 *     summary: Delete a financial record
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Record deleted successfully
 *       404:
 *         description: Record not found
 */

export default router;
