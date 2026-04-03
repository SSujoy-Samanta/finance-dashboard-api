import { Router } from 'express';
import { AuthController } from '@/modules/auth/auth.controller';
import { validate } from '@/middlewares/validate';
import { authenticate } from '@/middlewares/authenticate';
import { registerSchema, loginSchema } from '@/modules/auth/auth.schema';
import { authLimiter } from '@/middlewares/ratelimit/auth';

/**
 * Router for authentication related endpoints.
 * 
 * Applies rate limiting to all authentication endpoints to prevent abuse:
 * - authRateLimiter: Limits requests to 15 per 15 minutes per IP
 */

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and session management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *           format: email
 *         name:
 *           type: string
 *         role:
 *           type: string
 *           enum: [ADMIN, ANALYST, VIEWER]
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *         createdAt:
 *           type: string
 *           format: date-time
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             tokens:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *         message:
 *           type: string
 */

const router:Router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
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
 *                 format: password
 *                 minLength: 8
 *               name:
 *                 type: string
 *                 minLength: 2
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Email already in use
 */

/**
 * Register a new user.
 * 
 * Validation:
 * - Validates request body using registerSchema
 * - Applies rate limiting to prevent abuse
 * 
 * Authentication:
 * - No authentication required
 * 
 * Response:
 * - 201 Created: User created successfully with tokens
 * - 400 Bad Request: Invalid request data
 * - 409 Conflict: Email already exists
 * - 429 Too Many Requests: Rate limit exceeded
 */
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  AuthController.register,
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate and receive tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */

/**
 * User login endpoint.
 * 
 * Validation:
 * - Validates request body using loginSchema
 * - Applies rate limiting to prevent abuse
 * 
 * Authentication:
 * - No authentication required
 * 
 * Response:
 * - 200 OK: Login successful with tokens
 * - 400 Bad Request: Invalid request data
 * - 401 Unauthorized: Invalid credentials
 * - 429 Too Many Requests: Rate limit exceeded
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  AuthController.login,
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     description: Uses the refresh token from the cookie to issue a new access token.
 *     responses:
 *       200:
 *         description: Token refreshed successfully
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
 *                     accessToken:
 *                       type: string
 *       401:
 *         description: Invalid or expired refresh token
 */

/**
 * Refresh access token endpoint.
 * 
 * Authentication:
 * - Requires valid refresh token in cookie
 * 
 * Response:
 * - 200 OK: New access token generated
 * - 401 Unauthorized: Invalid or expired refresh token
 * - 429 Too Many Requests: Rate limit exceeded
 */
router.post('/refresh', authLimiter, AuthController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *       401:
 *         description: Not authenticated
 */

/**
 * User logout endpoint.
 * 
 * Authentication:
 * - Requires valid authentication
 * 
 * Response:
 * - 200 OK: Logout successful
 * - 401 Unauthorized: Not authenticated
 */
router.post('/logout', authenticate, AuthController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 */

/**
 * Get current user profile endpoint.
 * 
 * Authentication:
 * - Requires valid authentication
 * 
 * Response:
 * - 200 OK: User profile data
 * - 401 Unauthorized: Not authenticated
 */
router.get('/me', authenticate, AuthController.getMe);

export default router;
