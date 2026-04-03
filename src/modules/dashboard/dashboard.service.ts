import { RecordType } from '@/generated/prisma/client';
import { prisma } from '@/config/db';
import { Decimal } from 'decimal.js';
import { where } from '@/config/queryFilters';

interface TrendRow {
  period: Date;
  type: RecordType;
  total: number | string;
  count: number;
}

/** Represents a summary item grouped by category and type */
export interface CategoryBreakdown {
  category: string;
  type: RecordType;
  total: string;
  count: number;
}

/**
 * Represents a time-series trend data point.
 */
export interface TrendAggregate {
  /** The start of the period (ISO date string) */
  period: string;
  /** Total income for the period */
  income: string;
  /** Total expenses for the period */
  expenses: string;
  /** Net balance for the period */
  net: string;
}

/** Represents a recent record with its creator's details */
export interface RecentRecord {
  id: string;
  amount: string;
  type: RecordType;
  category: string;
  date: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { id: string, name: string, email: string };
}

export class DashboardService {
  /**
   * Calculates a global financial summary including total income, total expenses, and net balance.
   * Uses Prisma's groupBy to aggregate amounts across all active records.
   * 
   * @returns {Promise<{totalIncome: string, totalExpenses: string, netBalance: string, incomeCount: number, expenseCount: number}>} - High-level financial overview.
   */
  static async getSummary() {
    const grouped = await prisma.financialRecord.groupBy({
      by: ['type'],
      where: where.financialRecord.active,
      _sum: { amount: true },
      _count: { id: true },
    });

    const summary = {
      totalIncome: '0.00',
      totalExpenses: '0.00',
      netBalance: '0.00',
      incomeCount: 0,
      expenseCount: 0,
    };

    let income = new Decimal(0);
    let expense = new Decimal(0);

    grouped.forEach((group) => {
      if (group.type === RecordType.INCOME) {
        income = new Decimal(group._sum.amount?.toString() || '0');
        summary.totalIncome = income.toFixed(2);
        summary.incomeCount = group._count.id;
      } else {
        expense = new Decimal(group._sum.amount?.toString() || '0');
        summary.totalExpenses = expense.toFixed(2);
        summary.expenseCount = group._count.id;
      }
    });

    summary.netBalance = income.minus(expense).toFixed(2);

    return summary;
  }

  /**
   * Retrieves a breakdown of financial totals grouped by category and record type (Income/Expense).
   * Sorted by the total amount in descending order.
   * 
   * @returns {Promise<CategoryBreakdown[]>} - List of objects containing category, type, total sum, and count.
   */
  static async getByCategory(): Promise<CategoryBreakdown[]> {
    const grouped = await prisma.financialRecord.groupBy({
      by: ['category', 'type'],
      where: where.financialRecord.active,
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    return grouped.map((group) => ({
      category: group.category,
      type: group.type,
      total: group._sum.amount ? new Decimal(group._sum.amount.toString()).toFixed(2) : '0.00',
      count: group._count.id,
    }));
  }

  /**
   * Generates time-series trend data for a specific year, grouped by month or week.
   * Uses standard date ranges to leverage B-tree indices on the 'date' column.
   * 
   * @param {'monthly' | 'weekly'} period - The aggregation interval.
   * @param {number} year - The specific year to analyze.
   * @returns {Promise<TrendAggregate[]>} - List of trends containing period start, income, expenses, and net balance.
   */
  static async getTrends(period: 'monthly' | 'weekly', year: number): Promise<TrendAggregate[]> {
    const dateTrunc = period === 'monthly' ? 'month' : 'week';
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // Raw SQL optimized for index utilization (avoiding EXTRACT which bypasses indices)
    const rawResults = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC(${dateTrunc}, date) as period,
        type,
        SUM(amount) as total,
        COUNT(*) as count
      FROM financial_records
      WHERE 
        date >= ${startDate}
        AND date <= ${endDate}
        AND "deletedAt" IS NULL
      GROUP BY 1, 2
      ORDER BY 1 ASC
    ` as TrendRow[];

    const trendsMap = new Map<string, TrendAggregate>();

    rawResults.forEach((row) => {
      const periodKey = row.period.toISOString();
      if (!trendsMap.has(periodKey)) {
        trendsMap.set(periodKey, {
          period: periodKey,
          income: '0.00',
          expenses: '0.00',
          net: '0.00',
        });
      }

      const trend = trendsMap.get(periodKey)!;
      if (row.type === RecordType.INCOME) {
        trend.income = new Decimal(row.total.toString()).toFixed(2);
      } else {
        trend.expenses = new Decimal(row.total.toString()).toFixed(2);
      }

      trend.net = new Decimal(trend.income).minus(new Decimal(trend.expenses)).toFixed(2);
    });

    return Array.from(trendsMap.values());
  }

  /**
   * Retrieves the most recently created financial records with associated metadata.
   * 
   * @param {number} [limit=5] - The maximum number of records to return.
   * @returns {Promise<RecentRecord[]>} - List of recent records including creator information.
   */
  static async getRecent(limit: number = 5): Promise<RecentRecord[]> {
    const records = await prisma.financialRecord.findMany({
      where: where.financialRecord.active,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return records.map((r) => ({
      ...r,
      amount: r.amount.toString(),
    }));
  }
}
