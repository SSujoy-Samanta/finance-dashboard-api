import 'dotenv/config';
import { PrismaClient, Role, Status, RecordType } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import argon2 from 'argon2';
import Decimal from 'decimal.js';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required for seeding.');
}

const client = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(client);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Starting database Seeding ---');

  // 1. Create a diverse set of Users
  const userPresets = [
    { email: 'admin@finance.dev', name: 'System Admin', role: Role.ADMIN, status: Status.ACTIVE, password: 'Admin@1234' },
    { email: 'analyst@finance.dev', name: 'Data Analyst', role: Role.ANALYST, status: Status.ACTIVE, password: 'Analyst@1234' },
    { email: 'viewer@finance.dev', name: 'Standard Viewer', role: Role.VIEWER, status: Status.ACTIVE, password: 'Viewer@1234' },
    { email: 'inactive@finance.dev', name: 'Inactive User', role: Role.VIEWER, status: Status.INACTIVE, password: 'Inactive@1234' },
    { email: 'deleted@finance.dev', name: 'Soft Deleted User', role: Role.VIEWER, status: Status.ACTIVE, password: 'Deleted@1234', deletedAt: new Date() },
  ];

  const createdUsers = [];
  for (const preset of userPresets) {
    const hashedPassword = await argon2.hash(preset.password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64MB
    });

    // Use findFirst + create/update because the email unique index is a
    // partial index (WHERE deletedAt IS NULL) created via raw migration,
    // which is incompatible with Prisma's upsert ON CONFLICT clause.
    const existing = await prisma.user.findFirst({ where: { email: preset.email } });
    const user = existing
      ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          status: preset.status,
          role: preset.role,
          deletedAt: preset.deletedAt ?? null,
        },
      })
      : await prisma.user.create({
        data: {
          email: preset.email,
          name: preset.name,
          password: hashedPassword,
          role: preset.role,
          status: preset.status,
          emailVerified: true,
          deletedAt: preset.deletedAt ?? null,
        },
      });

    createdUsers.push(user);
    console.log(`[User] ${preset.role}: ${preset.email} (${preset.status})`);
  }

  // 2. Clear existing records for a clean slate
  console.log('Clearing old financial records...');
  await prisma.financialRecord.deleteMany({});

  // 3. Create Diverse Financial Records over last 12 months
  const categories: Array<{ name: string; type: RecordType; range: [number, number] }> = [
    { name: 'Salary', type: RecordType.INCOME, range: [5000, 7000] },
    { name: 'Freelance', type: RecordType.INCOME, range: [500, 2000] },
    { name: 'Rent', type: RecordType.EXPENSE, range: [1200, 1500] },
    { name: 'Groceries', type: RecordType.EXPENSE, range: [100, 300] },
    { name: 'Utilities', type: RecordType.EXPENSE, range: [80, 200] },
    { name: 'Transport', type: RecordType.EXPENSE, range: [50, 150] },
    { name: 'Entertainment', type: RecordType.EXPENSE, range: [20, 100] },
  ];


  const adminUser = createdUsers.find(u => u.role === Role.ADMIN)!;
  const analystUser = createdUsers.find(u => u.role === Role.ANALYST)!;

  console.log('Generating 12 months of realistic data...');

  for (let month = 0; month < 12; month++) {
    const seedDate = new Date();
    seedDate.setMonth(seedDate.getMonth() - month);

    for (const cat of categories) {
      // Monthly recurring logic
      const count = cat.name === 'Salary' || cat.name === 'Rent' ? 1 : Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < count; i++) {
        const amount = new Decimal(
          Math.floor(Math.random() * (cat.range[1] - cat.range[0] + 1)) + cat.range[0]
        );

        // Randomize day within the month
        const transactionDate = new Date(seedDate);
        transactionDate.setDate(Math.floor(Math.random() * 28) + 1);

        await prisma.financialRecord.create({
          data: {
            amount,
            type: cat.type,
            category: cat.name,
            date: transactionDate,
            notes: `${cat.name} transaction for ${transactionDate.toLocaleString('default', { month: 'long' })}`,
            createdById: i % 2 === 0 ? adminUser.id : analystUser.id,
            reference: `REF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          },
        });
      }
    }
  }

  console.log('--- Seeding Completed Successfully ---');
  console.log('Test Accounts:');
  userPresets.forEach(u => console.log(` - ${u.email} / ${u.password}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await client.end();
  });
