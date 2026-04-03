import { Request, Response } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { ApiResponse } from '@/utils/ApiResponse';
import { AuthService } from '@/modules/auth/auth.service';
import { env } from '@/config/env';
import { AppError } from '@/utils/AppError';

/**
 * Cookie configuration for setting the refresh token.
 * 
 * Options:
 * - httpOnly: Prevents client-side JavaScript from accessing the cookie
 * - secure: Only send cookie over HTTPS in production
 * - sameSite: Strict SameSite policy to prevent CSRF attacks
 * - maxAge: 7-day expiration for the refresh token
 * - path: Cookie accessible only on the auth refresh endpoint
 */
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/auth/refresh',
};

export class AuthController {
  /**
   * Handles user registration.
   * Extracts user data from the request body, calls the registration service,
   * sets the refresh token cookie, and returns the user object and access token.
   * 
   * @param {Request} req - Express request object containing registration details in body.
   * @param {Response} res - Express response object.
   */
  static register = catchAsync(async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await AuthService.register(
      req.body,
    );

    res.cookie('refreshToken', refreshToken, cookieOptions);

    res
      .status(201)
      .json(ApiResponse.success({ user, accessToken }, 'User registered'));
  });

  /**
   * Handles user login.
   * Authenticates credentials, sets the refresh token cookie upon success,
   * and returns the user object and access token.
   * 
   * @param {Request} req - Express request object containing email and password in body.
   * @param {Response} res - Express response object.
   */
  static login = catchAsync(async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await AuthService.login(
      req.body,
    );

    res.cookie('refreshToken', refreshToken, cookieOptions);

    res.json(ApiResponse.success({ user, accessToken }, 'Login successful'));
  });

  /**
   * Handles access token refreshment.
   * Extracts the refresh token from cookies and generates a new access token.
   * 
   * @param {Request} req - Express request object containing the refreshToken cookie.
   * @param {Response} res - Express response object.
   */
  static refresh = catchAsync(async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken;

    if (!token) {
      throw new AppError('Refresh token is missing', 401, 'MISSING_TOKEN');
    }

    const { accessToken } = await AuthService.refresh(token);

    res.json(ApiResponse.success({ accessToken }, 'Token refreshed'));
  });

  /**
   * Handles user logout.
   * Invalidates the session in the database and clears the refresh token cookie.
   * 
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
   * @throws {AppError} 401 - If the request is unauthorized.
   */
  static logout = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }
    await AuthService.logout(req.user.id);

    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });

    res.json(ApiResponse.success(null, 'Logged out successfully'));
  });

  /**
   * Retrieves the current authenticated user's profile information.
   * 
   * @param {Request} req - Express request object with populated user field.
   * @param {Response} res - Express response object.
   */
  static getMe = catchAsync(async (req: Request, res: Response) => {
    res.json(ApiResponse.success({ user: req.user }));
  });
}
