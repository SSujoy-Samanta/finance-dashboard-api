import { PaginationMeta } from './ApiResponse';

/**
 * Calculates standardized pagination metadata based on current page state and total records.
 * 
 * @param {number} page - The current page number (1-indexed).
 * @param {number} limit - The number of items per page.
 * @param {number} total - The total number of items available across all pages.
 * @returns {PaginationMeta} - An object containing calculated page numbers and navigation flags.
 */
export const getPaginationMeta = (
  page: number,
  limit: number,
  total: number,
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
