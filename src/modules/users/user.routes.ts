import { Router } from 'express';
import { UserController } from '@/modules/users/user.controller';
import { validate } from '@/middlewares/validate';
import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';
import { standardLimiter } from '@/middlewares/ratelimit/standard';
import { createUserSchema, updateUserSchema, getUserSchema, listUsersSchema } from '@/modules/users/user.schema';

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and administration
 */

const router:Router = Router();

// Rate limiting for internal user management
router.use(standardLimiter);
/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user (Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, ANALYST, VIEWER]
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Forbidden - Insufficient permissions
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
 * Create user endpoint.
 * 
 * Authentication:
 * - Requires valid authentication
 * 
 * Authorization:
 * - Requires 'user:create' permission
 * 
 * Validation:
 * - Validates request body using createUserSchema
 * 
 * Response:
 * - 201 Created: User created successfully
 * - 400 Bad Request: Invalid request data
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Insufficient permissions
 * - 409 Conflict: Email already exists
 */
router.post(
  '/',
  authorize('user:create'),
  validate(createUserSchema),
  UserController.create,
);

/**
 * List users endpoint.
 * 
 * Authentication:
 * - Requires valid authentication
 * 
 * Authorization:
 * - Requires 'user:read' permission
 * 
 * Response:
 * - 200 OK: List of users with pagination metadata
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Insufficient permissions
 */
router.get(
  '/',
  authorize('user:read'),
  validate(listUsersSchema),
  UserController.list,
);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List all users
 *     tags: [Users]
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
 *           default: 20
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
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
 *                     $ref: '#/components/schemas/User'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 */

/**
 * Get user by ID endpoint.
 * 
 * Authentication:
 * - Requires valid authentication
 * 
 * Authorization:
 * - Requires 'user:read' permission
 * 
 * Validation:
 * - Validates user ID parameter using getUserSchema
 * 
 * Response:
 * - 200 OK: User data
 * - 400 Bad Request: Invalid user ID
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Insufficient permissions
 * - 404 Not Found: User not found
 */
router.get(
  '/:id',
  authorize('user:read'),
  validate(getUserSchema),
  UserController.getById,
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
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
 *         description: User data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */

/**
 * Update user endpoint.
 * 
 * Authentication:
 * - Requires valid authentication
 * 
 * Authorization:
 * - Requires 'user:update' permission
 * 
 * Validation:
 * - Validates user ID parameter using getUserSchema
 * - Validates request body using updateUserSchema
 * 
 * Response:
 * - 200 OK: Updated user data
 * - 400 Bad Request: Invalid request data
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Insufficient permissions
 * - 404 Not Found: User not found
 */
router.patch(
  '/:id',
  authorize('user:update'),
  validate(updateUserSchema),
  UserController.update,
);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update an existing user
 *     tags: [Users]
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
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, ANALYST, VIEWER]
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */

export default router;
