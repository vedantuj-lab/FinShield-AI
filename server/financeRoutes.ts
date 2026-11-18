import type { Express } from 'express';
import { and, count, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../src/db/index.ts';
import {
  budgets,
  businessCashflow,
  businessInvoices,
  evidence,
  financialTransactions,
  investigations,
  modelConfigurations,
  paperTrades,
  portfolioHoldings,
  taxCalculations,
  users,
} from '../src/db/schema.ts';
import {
  AuthRequest,
  logAdminAction,
  logAiActivity,
  rateLimit,
  requireAdmin,
  requireAuth,
} from './auth.ts';
import { askFinancialAssistantWithGemini } from './geminiService.ts';

const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Housing',
  'Healthcare',
  'Education',
  'Entertainment',
  'Utilities',
  'Transfers',
  'Other',
] as const;

function autoCategorise(description: string): string {
  const d = description.toLowerCase();
  if (/swiggy|zomato|cafe|restaurant|grocery|blinkit|zepto|food|dmart/.test(d)) return 'Food';
  if (/uber|ola|metro|petrol|fuel|irctc|flight|rapido|transport/.test(d)) return 'Transport';
  if (/amazon|flipkart|myntra|mall|store|shopping/.test(d)) return 'Shopping';
  if (/rent|maintenance|housing|society|broker/.test(d)) return 'Housing';
  if (/hospital|pharmacy|apollo|1mg|doctor|clinic|health/.test(d)) return 'Healthcare';
  if (/tuition|course|udemy|college|school|book|education/.test(d)) return 'Education';
  if (/netflix|spotify|bookmyshow|movie|prime|gaming/.test(d)) return 'Entertainment';
  if (/electricity|jio|airtel|broadband|gas|water|bill|recharge/.test(d)) return 'Utilities';
  if (/upi|neft|imps|transfer|sent to/.test(d)) return 'Transfers';
  return 'Other';
}

// Clearly labelled SYNTHETIC / HISTORICAL demonstration NSE market series
const SYNTHETIC_MARKET_SERIES: Record<
  string,
  {
    name: string;
    sector: string;
    sourceLabel: string;
    summary: string;
    candles: Array<{ date: string; close: number; volume: number }>;
  }
> = {
  TCS: {
    name: 'Tata Consultancy Services (Synthetic Historical Series)',
    sector: 'IT Services',
    sourceLabel: 'SYNTHETIC DEMONSTRATION DATA — Educational Historical Series (Not Live NSE Feed)',
    summary:
      'Large-cap IT services exporter. Historical series demonstrates steady trend with moderate quarterly earnings volatility.',
    candles: [
      { date: '2026-01', close: 3820, volume: 2150000 },
      { date: '2026-02', close: 3890, volume: 2290000 },
      { date: '2026-03', close: 3760, volume: 2610000 },
      { date: '2026-04', close: 3845, volume: 1980000 },
      { date: '2026-05', close: 3960, volume: 2420000 },
      { date: '2026-06', close: 4040, volume: 2510000 },
      { date: '2026-07', close: 3985, volume: 2110000 },
      { date: '2026-08', close: 4120, volume: 2740000 },
      { date: '2026-09', close: 4195, volume: 2630000 },
      { date: '2026-10', close: 4150, volume: 2300000 },
    ],
  },
  HDFCBANK: {
    name: 'HDFC Bank Ltd (Synthetic Historical Series)',
    sector: 'Banking & Finance',
    sourceLabel: 'SYNTHETIC DEMONSTRATION DATA — Educational Historical Series (Not Live NSE Feed)',
    summary:
      'Private-sector banking bellwether. Series illustrates rate-cycle consolidation followed by gradual recovery.',
    candles: [
      { date: '2026-01', close: 1520, volume: 14200000 },
      { date: '2026-02', close: 1485, volume: 16100000 },
      { date: '2026-03', close: 1510, volume: 13800000 },
      { date: '2026-04', close: 1560, volume: 15400000 },
      { date: '2026-05', close: 1595, volume: 14900000 },
      { date: '2026-06', close: 1640, volume: 17300000 },
      { date: '2026-07', close: 1625, volume: 13900000 },
      { date: '2026-08', close: 1670, volume: 15800000 },
      { date: '2026-09', close: 1710, volume: 16500000 },
      { date: '2026-10', close: 1695, volume: 14700000 },
    ],
  },
  RELIANCE: {
    name: 'Reliance Industries Ltd (Synthetic Historical Series)',
    sector: 'Energy, Retail & Telecom',
    sourceLabel: 'SYNTHETIC DEMONSTRATION DATA — Educational Historical Series (Not Live NSE Feed)',
    summary:
      'Diversified conglomerate spanning energy, retail, and digital telecom. Demonstrates range-bound swings and breakout moves.',
    candles: [
      { date: '2026-01', close: 2740, volume: 6400000 },
      { date: '2026-02', close: 2810, volume: 7100000 },
      { date: '2026-03', close: 2790, volume: 5900000 },
      { date: '2026-04', close: 2880, volume: 7600000 },
      { date: '2026-05', close: 2845, volume: 6200000 },
      { date: '2026-06', close: 2950, volume: 8100000 },
      { date: '2026-07', close: 3015, volume: 7900000 },
      { date: '2026-08', close: 2980, volume: 6800000 },
      { date: '2026-09', close: 3060, volume: 7400000 },
      { date: '2026-10', close: 3110, volume: 7200000 },
    ],
  },
  NIFTYBEES: {
    name: 'Nippon India ETF Nifty 50 BeES (Synthetic Series)',
    sector: 'Index ETF',
    sourceLabel: 'SYNTHETIC DEMONSTRATION DATA — Educational Historical Series (Not Live NSE Feed)',
    summary:
      'Broad-market index ETF tracking 50 large-cap Indian companies. Lower single-stock concentration risk.',
    candles: [
      { date: '2026-01', close: 248, volume: 5100000 },
      { date: '2026-02', close: 251, volume: 4900000 },
      { date: '2026-03', close: 250, volume: 5300000 },
      { date: '2026-04', close: 256, volume: 5600000 },
      { date: '2026-05', close: 260, volume: 5200000 },
      { date: '2026-06', close: 265, volume: 6100000 },
      { date: '2026-07', close: 268, volume: 5800000 },
      { date: '2026-08', close: 272, volume: 5900000 },
      { date: '2026-09', close: 276, volume: 6300000 },
      { date: '2026-10', close: 279, volume: 5700000 },
    ],
  },
};

// Versioned Indian Tax Rules (configurable, not permanently hardcoded)
const TAX_RULES_BY_YEAR: Record<
  string,
  {
    taxYear: string;
    standardDeductionOld: number;
    standardDeductionNew: number;
    cessRate: number;
    oldSlabs: Array<{ upTo: number | null; rate: number }>;
    newSlabs: Array<{ upTo: number | null; rate: number }>;
    rebate87ANewLimit: number;
    rebate87AOldLimit: number;
    notes: string;
  }
> = {
  'FY 2025-26': {
    taxYear: 'FY 2025-26',
    standardDeductionOld: 50000,
    standardDeductionNew: 75000,
    cessRate: 0.04,
    oldSlabs: [
      { upTo: 250000, rate: 0 },
      { upTo: 500000, rate: 0.05 },
      { upTo: 1000000, rate: 0.2 },
      { upTo: null, rate: 0.3 },
    ],
    newSlabs: [
      { upTo: 400000, rate: 0 },
      { upTo: 800000, rate: 0.05 },
      { upTo: 1200000, rate: 0.1 },
      { upTo: 1600000, rate: 0.15 },
      { upTo: 2000000, rate: 0.2 },
      { upTo: 2400000, rate: 0.25 },
      { upTo: null, rate: 0.3 },
    ],
    rebate87ANewLimit: 1200000,
    rebate87AOldLimit: 500000,
    notes:
      'Illustrative FY 2025-26 individual resident (<60 yrs) slabs including 4% Health & Education Cess. Does not model surcharge or capital gains. Not an official ITR filing.',
  },
};

function computeSlabTax(taxableIncome: number, slabs: Array<{ upTo: number | null; rate: number }>): number {
  let tax = 0;
  let prev = 0;
  for (const slab of slabs) {
    if (taxableIncome <= prev) break;
    const upper = slab.upTo === null ? taxableIncome : Math.min(taxableIncome, slab.upTo);
    const slice = Math.max(0, upper - prev);
    tax += slice * slab.rate;
    if (slab.upTo === null) break;
    prev = slab.upTo;
  }
  return Math.round(tax);
}

export function registerFinanceRoutes(app: Express) {
  // ==================== SMART BUDGETING & FINANCIAL INSIGHTS ====================

  app.get('/api/finance/transactions', requireAuth, async (req: AuthRequest, res) => {
    try {
      const rows = await db
        .select()
        .from(financialTransactions)
        .where(eq(financialTransactions.userId, req.dbUser!.id))
        .orderBy(desc(financialTransactions.transactionDate), desc(financialTransactions.id));
      const userBudgets = await db
        .select()
        .from(budgets)
        .where(eq(budgets.userId, req.dbUser!.id));
      res.json({ transactions: rows, budgets: userBudgets, categories: EXPENSE_CATEGORIES });
    } catch (err) {
      console.error('Get transactions error:', err);
      res.status(500).json({ error: 'Failed to load financial transactions.' });
    }
  });

  app.post('/api/finance/transactions', requireAuth, async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        transactionDate: z.string().min(4).max(20),
        description: z.string().min(2).max(200),
        category: z.string().optional(),
        amount: z.number().int().positive(),
        type: z.enum(['income', 'expense']).default('expense'),
        isRecurring: z.boolean().optional().default(false),
        source: z.enum(['manual', 'csv', 'upi_sms', 'synthetic']).optional().default('manual'),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Provide date, description, and positive amount.' });
      }
      const category =
        parsed.data.category && parsed.data.category.trim()
          ? parsed.data.category.trim()
          : parsed.data.type === 'income'
            ? 'Income'
            : autoCategorise(parsed.data.description);

      const inserted = await db
        .insert(financialTransactions)
        .values({
          userId: req.dbUser!.id,
          transactionDate: parsed.data.transactionDate,
          description: parsed.data.description.trim(),
          category,
          amount: parsed.data.amount,
          type: parsed.data.type,
          isRecurring: parsed.data.isRecurring,
          source: parsed.data.source,
          isSyntheticDemo: parsed.data.source === 'synthetic',
        })
        .returning();

      res.status(201).json({ transaction: inserted[0] });
    } catch (err) {
      console.error('Create transaction error:', err);
      res.status(500).json({ error: 'Failed to save transaction.' });
    }
  });

  app.post('/api/finance/transactions/import', requireAuth, async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        rawText: z.string().min(5).max(20000),
        format: z.enum(['csv', 'upi_sms']).default('csv'),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Provide CSV lines or UPI SMS notifications to import.' });
      }

      const lines = parsed.data.rawText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      const toInsert: Array<typeof financialTransactions.$inferInsert> = [];
      const today = new Date().toISOString().slice(0, 10);

      for (const line of lines) {
        if (/^date\s*,/i.test(line)) continue;
        if (parsed.data.format === 'csv') {
          const parts = line.split(',').map((s) => s.trim());
          if (parts.length < 3) continue;
          const [dateStr, descStr, amtStr, typeStr] = parts;
          const amount = Math.round(Math.abs(Number(amtStr.replace(/[^0-9.-]/g, ''))));
          if (!amount || Number.isNaN(amount)) continue;
          const txType = /income|credit|salary/i.test(typeStr || descStr) ? 'income' : 'expense';
          toInsert.push({
            userId: req.dbUser!.id,
            transactionDate: /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : today,
            description: descStr.slice(0, 180),
            category: txType === 'income' ? 'Income' : autoCategorise(descStr),
            amount,
            type: txType,
            isRecurring: /rent|emi|netflix|spotify|sip|bill/i.test(descStr),
            source: 'csv',
            isSyntheticDemo: false,
          });
        } else {
          const amtMatch = line.match(/(?:rs\.?|inr|₹)\s*([0-9,]+(?:\.[0-9]+)?)/i);
          if (!amtMatch) continue;
          const amount = Math.round(Number(amtMatch[1].replace(/,/g, '')));
          if (!amount) continue;
          const isCredit = /credited|received|deposited/i.test(line);
          toInsert.push({
            userId: req.dbUser!.id,
            transactionDate: today,
            description: line.slice(0, 180),
            category: isCredit ? 'Income' : autoCategorise(line),
            amount,
            type: isCredit ? 'income' : 'expense',
            isRecurring: /autopay|mandate|subscription|emi/i.test(line),
            source: 'upi_sms',
            isSyntheticDemo: false,
          });
        }
      }

      if (toInsert.length === 0) {
        return res.status(400).json({
          error:
            'No valid transactions could be parsed. For CSV use: YYYY-MM-DD, Description, Amount, expense|income',
        });
      }

      const inserted = await db.insert(financialTransactions).values(toInsert).returning();
      res.status(201).json({ importedCount: inserted.length, transactions: inserted });
    } catch (err) {
      console.error('Import transactions error:', err);
      res.status(500).json({ error: 'Failed to import transactions.' });
    }
  });

  app.delete('/api/finance/transactions/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid transaction ID.' });
      const deleted = await db
        .delete(financialTransactions)
        .where(and(eq(financialTransactions.id, id), eq(financialTransactions.userId, req.dbUser!.id)))
        .returning();
      if (!deleted.length) return res.status(404).json({ error: 'Transaction not found.' });
      res.json({ deleted: true });
    } catch (err) {
      console.error('Delete transaction error:', err);
      res.status(500).json({ error: 'Failed to delete transaction.' });
    }
  });

  app.put('/api/finance/budgets', requireAuth, async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        month: z.string().regex(/^\d{4}-\d{2}$/),
        category: z.string().min(2).max(50),
        limitAmount: z.number().int().positive(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Provide month (YYYY-MM), category, and positive limit.' });
      }

      const existing = await db
        .select()
        .from(budgets)
        .where(
          and(
            eq(budgets.userId, req.dbUser!.id),
            eq(budgets.month, parsed.data.month),
            eq(budgets.category, parsed.data.category)
          )
        )
        .limit(1);

      if (existing.length) {
        const updated = await db
          .update(budgets)
          .set({ limitAmount: parsed.data.limitAmount })
          .where(eq(budgets.id, existing[0].id))
          .returning();
        return res.json({ budget: updated[0] });
      }

      const inserted = await db
        .insert(budgets)
        .values({
          userId: req.dbUser!.id,
          month: parsed.data.month,
          category: parsed.data.category,
          limitAmount: parsed.data.limitAmount,
        })
        .returning();
      res.status(201).json({ budget: inserted[0] });
    } catch (err) {
      console.error('Upsert budget error:', err);
      res.status(500).json({ error: 'Failed to save category budget.' });
    }
  });

  app.get('/api/finance/insights', requireAuth, async (req: AuthRequest, res) => {
    try {
      const txs = await db
        .select()
        .from(financialTransactions)
        .where(eq(financialTransactions.userId, req.dbUser!.id));
      const userBudgets = await db
        .select()
        .from(budgets)
        .where(eq(budgets.userId, req.dbUser!.id));

      let totalIncome = 0;
      let totalExpenses = 0;
      const byCategory: Record<string, number> = {};
      const byMonth: Record<string, { month: string; income: number; expenses: number; savings: number }> = {};

      for (const tx of txs) {
        const m = tx.transactionDate.slice(0, 7);
        if (!byMonth[m]) byMonth[m] = { month: m, income: 0, expenses: 0, savings: 0 };
        if (tx.type === 'income') {
          totalIncome += tx.amount;
          byMonth[m].income += tx.amount;
        } else {
          totalExpenses += tx.amount;
          byMonth[m].expenses += tx.amount;
          byCategory[tx.category] = (byCategory[tx.category] || 0) + tx.amount;
        }
      }

      for (const m of Object.keys(byMonth)) {
        byMonth[m].savings = byMonth[m].income - byMonth[m].expenses;
      }

      const expenseTxs = txs.filter((t) => t.type === 'expense');
      const avgExpense =
        expenseTxs.length > 0 ? totalExpenses / expenseTxs.length : 0;
      const anomalies = expenseTxs
        .filter((t) => avgExpense > 0 && t.amount > avgExpense * 2.1)
        .slice(0, 5)
        .map((t) => ({
          id: t.id,
          date: t.transactionDate,
          description: t.description,
          category: t.category,
          amount: t.amount,
          reason: `Amount ₹${t.amount.toLocaleString('en-IN')} is more than 2x your average expense (₹${Math.round(avgExpense).toLocaleString('en-IN')}).`,
        }));

      const recurring = txs.filter((t) => t.isRecurring).slice(0, 8);

      const categoryBreakdown = Object.entries(byCategory)
        .map(([category, spent]) => {
          const b = userBudgets.find((x) => x.category === category);
          return {
            category,
            spent,
            limit: b?.limitAmount || 0,
            utilisationPct: b?.limitAmount ? Math.round((spent / b.limitAmount) * 100) : null,
          };
        })
        .sort((a, b) => b.spent - a.spent);

      res.json({
        totalIncome,
        totalExpenses,
        savings: totalIncome - totalExpenses,
        savingsRatePct: totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0,
        categoryBreakdown,
        monthlyTrends: Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)),
        anomalies,
        recurring,
      });
    } catch (err) {
      console.error('Financial insights error:', err);
      res.status(500).json({ error: 'Failed to compute financial insights.' });
    }
  });

  // Idempotent synthetic 3-month financial demo seeder
  app.post('/api/finance/seed-demo', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const existingTx = await db
        .select({ value: count() })
        .from(financialTransactions)
        .where(and(eq(financialTransactions.userId, userId), eq(financialTransactions.isSyntheticDemo, true)));

      let seededTx = 0;
      if (Number(existingTx[0]?.value || 0) === 0) {
        const sampleTxs: Array<typeof financialTransactions.$inferInsert> = [
          { userId, transactionDate: '2026-09-01', description: 'Monthly Salary Credit (Synthetic)', category: 'Income', amount: 85000, type: 'income', isRecurring: true, source: 'synthetic', isSyntheticDemo: true },
          { userId, transactionDate: '2026-09-03', description: 'Apartment Rent Transfer', category: 'Housing', amount: 22000, type: 'expense', isRecurring: true, source: 'synthetic', isSyntheticDemo: true },
          { userId, transactionDate: '2026-09-07', description: 'DMart Groceries & Swiggy', category: 'Food', amount: 9400, type: 'expense', isRecurring: false, source: 'synthetic', isSyntheticDemo: true },
          { userId, transactionDate: '2026-09-12', description: 'Electricity & JioFiber Bill', category: 'Utilities', amount: 3450, type: 'expense', isRecurring: true, source: 'synthetic', isSyntheticDemo: true },
          { userId, transactionDate: '2026-09-19', description: 'Metro Card & Uber Commute', category: 'Transport', amount: 4100, type: 'expense', isRecurring: false, source: 'synthetic', isSyntheticDemo: true },
          { userId, transactionDate: '2026-10-01', description: 'Monthly Salary Credit (Synthetic)', category: 'Income', amount: 85000, type: 'income', isRecurring: true, source: 'synthetic', isSyntheticDemo: true },
          { userId, transactionDate: '2026-10-03', description: 'Apartment Rent Transfer', category: 'Housing', amount: 22000, type: 'expense', isRecurring: true, source: 'synthetic', isSyntheticDemo: true },
          { userId, transactionDate: '2026-10-09', description: 'Festive Electronics Purchase (Unusual)', category: 'Shopping', amount: 28500, type: 'expense', isRecurring: false, source: 'synthetic', isSyntheticDemo: true },
          { userId, transactionDate: '2026-10-14', description: 'Groceries & Dining Out', category: 'Food', amount: 10800, type: 'expense', isRecurring: false, source: 'synthetic', isSyntheticDemo: true },
          { userId, transactionDate: '2026-10-20', description: 'Apollo Pharmacy & Lab Checkup', category: 'Healthcare', amount: 3200, type: 'expense', isRecurring: false, source: 'synthetic', isSyntheticDemo: true },
          { userId, transactionDate: '2026-11-01', description: 'Monthly Salary Credit (Synthetic)', category: 'Income', amount: 88000, type: 'income', isRecurring: true, source: 'synthetic', isSyntheticDemo: true },
          { userId, transactionDate: '2026-11-03', description: 'Apartment Rent Transfer', category: 'Housing', amount: 22000, type: 'expense', isRecurring: true, source: 'synthetic', isSyntheticDemo: true },
          { userId, transactionDate: '2026-11-06', description: 'Online Course Subscription', category: 'Education', amount: 4500, type: 'expense', isRecurring: false, source: 'synthetic', isSyntheticDemo: true },
          { userId, transactionDate: '2026-11-10', description: 'Electricity & Broadband AutoPay', category: 'Utilities', amount: 3600, type: 'expense', isRecurring: true, source: 'synthetic', isSyntheticDemo: true },
          { userId, transactionDate: '2026-11-12', description: 'Groceries & Food Delivery', category: 'Food', amount: 8900, type: 'expense', isRecurring: false, source: 'synthetic', isSyntheticDemo: true },
        ];
        await db.insert(financialTransactions).values(sampleTxs);
        seededTx = sampleTxs.length;
      }

      const existingHoldings = await db
        .select({ value: count() })
        .from(portfolioHoldings)
        .where(and(eq(portfolioHoldings.userId, userId), eq(portfolioHoldings.isSyntheticDemo, true)));

      if (Number(existingHoldings[0]?.value || 0) === 0) {
        await db.insert(portfolioHoldings).values([
          {
            userId,
            symbol: 'NIFTYBEES',
            assetName: 'Nifty 50 Index ETF',
            category: 'Index Fund / ETF',
            quantity: 200,
            avgPurchasePrice: 252,
            referencePrice: 279,
            priceDate: '2026-10-31',
            priceSource: 'SYNTHETIC DEMONSTRATION DATA',
            isSyntheticDemo: true,
          },
          {
            userId,
            symbol: 'HDFCBANK',
            assetName: 'HDFC Bank Equity',
            category: 'Equity',
            quantity: 35,
            avgPurchasePrice: 1540,
            referencePrice: 1695,
            priceDate: '2026-10-31',
            priceSource: 'SYNTHETIC DEMONSTRATION DATA',
            isSyntheticDemo: true,
          },
          {
            userId,
            symbol: 'SBI-FD',
            assetName: 'Bank Fixed Deposit (1-Yr)',
            category: 'Fixed Deposit',
            quantity: 1,
            avgPurchasePrice: 100000,
            referencePrice: 106800,
            priceDate: '2026-10-31',
            priceSource: 'SYNTHETIC DEMONSTRATION DATA',
            isSyntheticDemo: true,
          },
        ]);
      }

      const existingInv = await db
        .select({ value: count() })
        .from(businessInvoices)
        .where(and(eq(businessInvoices.userId, userId), eq(businessInvoices.isSyntheticDemo, true)));

      if (Number(existingInv[0]?.value || 0) === 0) {
        await db.insert(businessInvoices).values([
          {
            userId,
            invoiceNumber: `INV-2026-${userId}01`,
            customerName: 'Aarav Retail Traders (Synthetic)',
            customerGstin: '27AABCU9603R1ZM',
            itemsJson: [
              { description: 'Monthly Digital Advisory Retainer', qty: 1, rate: 25000 },
              { description: 'GST Compliance Audit Setup', qty: 1, rate: 10000 },
            ],
            subtotal: 35000,
            gstRate: 18,
            gstAmount: 6300,
            totalAmount: 41300,
            status: 'paid',
            dueDate: '2026-10-25',
            isSyntheticDemo: true,
          },
          {
            userId,
            invoiceNumber: `INV-2026-${userId}02`,
            customerName: 'Sahyadri Logistics Pvt Ltd (Synthetic)',
            customerGstin: '27AAACR5055K1Z5',
            itemsJson: [{ description: 'Quarterly Software Support', qty: 1, rate: 18000 }],
            subtotal: 18000,
            gstRate: 18,
            gstAmount: 3240,
            totalAmount: 21240,
            status: 'unpaid',
            dueDate: '2026-11-30',
            isSyntheticDemo: true,
          },
        ]);
      }

      res.json({
        seeded: true,
        seededTransactions: seededTx,
        label: 'SYNTHETIC DEMONSTRATION DATA',
      });
    } catch (err) {
      console.error('Seed finance demo error:', err);
      res.status(500).json({ error: 'Failed to seed synthetic financial data.' });
    }
  });

  // ==================== PORTFOLIO ANALYSIS ====================

  app.get('/api/finance/portfolio', requireAuth, async (req: AuthRequest, res) => {
    try {
      const holdings = await db
        .select()
        .from(portfolioHoldings)
        .where(eq(portfolioHoldings.userId, req.dbUser!.id))
        .orderBy(desc(portfolioHoldings.createdAt));

      let totalInvested = 0;
      let totalCurrent = 0;
      const byCategory: Record<string, number> = {};

      const enriched = holdings.map((h) => {
        const invested = h.quantity * h.avgPurchasePrice;
        const current = h.quantity * h.referencePrice;
        const pnl = current - invested;
        totalInvested += invested;
        totalCurrent += current;
        byCategory[h.category] = (byCategory[h.category] || 0) + current;
        return {
          ...h,
          investedValue: invested,
          currentValue: current,
          pnl,
          pnlPct: invested > 0 ? Number(((pnl / invested) * 100).toFixed(2)) : 0,
        };
      });

      const allocation = Object.entries(byCategory).map(([category, value]) => ({
        category,
        value,
        pct: totalCurrent > 0 ? Number(((value / totalCurrent) * 100).toFixed(1)) : 0,
      }));

      const maxHolding = enriched.reduce(
        (max, h) => (h.currentValue > (max?.currentValue || 0) ? h : max),
        null as (typeof enriched)[number] | null
      );
      const maxWeightPct =
        maxHolding && totalCurrent > 0 ? Math.round((maxHolding.currentValue / totalCurrent) * 100) : 0;

      const concentrationRisk =
        maxWeightPct >= 50
          ? `High concentration: ${maxHolding?.assetName} represents ${maxWeightPct}% of your portfolio.`
          : maxWeightPct >= 35
            ? `Moderate concentration: ${maxHolding?.assetName} represents ${maxWeightPct}% of your portfolio.`
            : 'Balanced allocation across recorded holdings.';

      res.json({
        holdings: enriched,
        summary: {
          totalInvested,
          totalCurrent,
          totalPnl: totalCurrent - totalInvested,
          totalPnlPct:
            totalInvested > 0 ? Number((((totalCurrent - totalInvested) / totalInvested) * 100).toFixed(2)) : 0,
          concentrationRisk,
          allocation,
        },
      });
    } catch (err) {
      console.error('Portfolio load error:', err);
      res.status(500).json({ error: 'Failed to load portfolio.' });
    }
  });

  app.post('/api/finance/portfolio', requireAuth, async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        symbol: z.string().min(1).max(24),
        assetName: z.string().min(2).max(120),
        category: z.string().min(2).max(60),
        quantity: z.number().int().positive(),
        avgPurchasePrice: z.number().int().positive(),
        referencePrice: z.number().int().positive(),
        priceDate: z.string().min(4).max(20).optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Provide symbol, asset name, category, quantity, and prices.' });
      }
      const inserted = await db
        .insert(portfolioHoldings)
        .values({
          userId: req.dbUser!.id,
          symbol: parsed.data.symbol.toUpperCase().trim(),
          assetName: parsed.data.assetName.trim(),
          category: parsed.data.category.trim(),
          quantity: parsed.data.quantity,
          avgPurchasePrice: parsed.data.avgPurchasePrice,
          referencePrice: parsed.data.referencePrice,
          priceDate: parsed.data.priceDate || new Date().toISOString().slice(0, 10),
          priceSource: 'User-Entered Reference Price (Not Live Market Feed)',
          isSyntheticDemo: false,
        })
        .returning();
      res.status(201).json({ holding: inserted[0] });
    } catch (err) {
      console.error('Portfolio add error:', err);
      res.status(500).json({ error: 'Failed to add portfolio holding.' });
    }
  });

  app.delete('/api/finance/portfolio/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid holding ID.' });
      const deleted = await db
        .delete(portfolioHoldings)
        .where(and(eq(portfolioHoldings.id, id), eq(portfolioHoldings.userId, req.dbUser!.id)))
        .returning();
      if (!deleted.length) return res.status(404).json({ error: 'Holding not found.' });
      res.json({ deleted: true });
    } catch (err) {
      console.error('Portfolio delete error:', err);
      res.status(500).json({ error: 'Failed to delete holding.' });
    }
  });

  // ==================== MARKET INSIGHTS & PAPER TRADING ====================

  app.get('/api/finance/market/historical', requireAuth, async (req: AuthRequest, res) => {
    const symbol = String(req.query.symbol || 'TCS').toUpperCase();
    const entry = SYNTHETIC_MARKET_SERIES[symbol] || SYNTHETIC_MARKET_SERIES.TCS;
    const candles = entry.candles.map((c, idx, arr) => {
      const slice3 = arr.slice(Math.max(0, idx - 2), idx + 1);
      const sma3 = Math.round(slice3.reduce((s, x) => s + x.close, 0) / slice3.length);
      return { ...c, sma3 };
    });
    const first = candles[0].close;
    const last = candles[candles.length - 1].close;
    const returnPct = Number((((last - first) / first) * 100).toFixed(2));
    res.json({
      symbol: SYNTHETIC_MARKET_SERIES[symbol] ? symbol : 'TCS',
      availableSymbols: Object.keys(SYNTHETIC_MARKET_SERIES),
      name: entry.name,
      sector: entry.sector,
      sourceLabel: entry.sourceLabel,
      summary: entry.summary,
      latestPrice: last,
      periodReturnPct: returnPct,
      candles,
    });
  });

  app.get('/api/finance/paper-trades', requireAuth, async (req: AuthRequest, res) => {
    try {
      const trades = await db
        .select()
        .from(paperTrades)
        .where(eq(paperTrades.userId, req.dbUser!.id))
        .orderBy(desc(paperTrades.createdAt));

      const startingCash = 1000000; // ₹10,00,000 virtual cash
      let cashBalance = startingCash;
      for (const t of [...trades].reverse()) {
        if (t.side === 'BUY') cashBalance -= t.quantity * t.price;
        else cashBalance += t.quantity * t.price;
      }

      res.json({
        isSimulated: true,
        startingCash,
        cashBalance,
        trades,
      });
    } catch (err) {
      console.error('Paper trades load error:', err);
      res.status(500).json({ error: 'Failed to load simulated trades.' });
    }
  });

  app.post('/api/finance/paper-trades', requireAuth, async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        symbol: z.string().min(1).max(24),
        side: z.enum(['BUY', 'SELL']),
        quantity: z.number().int().positive(),
        price: z.number().int().positive(),
        stopLoss: z.number().int().positive().optional(),
        takeProfit: z.number().int().positive().optional(),
        strategyNote: z.string().max(300).optional().default(''),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Provide symbol, side (BUY/SELL), quantity, and price.' });
      }
      const inserted = await db
        .insert(paperTrades)
        .values({
          userId: req.dbUser!.id,
          symbol: parsed.data.symbol.toUpperCase().trim(),
          side: parsed.data.side,
          quantity: parsed.data.quantity,
          price: parsed.data.price,
          stopLoss: parsed.data.stopLoss ?? null,
          takeProfit: parsed.data.takeProfit ?? null,
          strategyNote: parsed.data.strategyNote.trim(),
          realizedPnl: 0,
          isSimulated: true,
        })
        .returning();
      res.status(201).json({ trade: inserted[0] });
    } catch (err) {
      console.error('Paper trade error:', err);
      res.status(500).json({ error: 'Failed to record simulated trade.' });
    }
  });

  app.post('/api/finance/paper-trades/backtest', requireAuth, async (req: AuthRequest, res) => {
    const schema = z.object({
      symbol: z.string().default('TCS'),
      stopLossPct: z.number().min(1).max(30).default(5),
      takeProfitPct: z.number().min(1).max(50).default(10),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid backtest parameters.' });

    const sym = parsed.data.symbol.toUpperCase();
    const series = SYNTHETIC_MARKET_SERIES[sym] || SYNTHETIC_MARKET_SERIES.TCS;
    const candles = series.candles;

    let entryPrice = candles[0].close;
    let peak = entryPrice;
    let maxDrawdownPct = 0;
    let wins = 0;
    let totalTrades = 0;
    let cumulativePnlPct = 0;

    for (let i = 1; i < candles.length; i++) {
      const price = candles[i].close;
      if (price > peak) peak = price;
      const dd = ((peak - price) / peak) * 100;
      if (dd > maxDrawdownPct) maxDrawdownPct = dd;

      const changePct = ((price - entryPrice) / entryPrice) * 100;
      if (changePct >= parsed.data.takeProfitPct || changePct <= -parsed.data.stopLossPct || i === candles.length - 1) {
        totalTrades++;
        if (changePct > 0) wins++;
        cumulativePnlPct += changePct;
        entryPrice = price;
      }
    }

    res.json({
      symbol: sym,
      testPeriod: `${candles[0].date} to ${candles[candles.length - 1].date}`,
      dataSource: series.sourceLabel,
      assumptions: `Simulated stop-loss ${parsed.data.stopLossPct}%, take-profit ${parsed.data.takeProfitPct}%, zero brokerage/slippage modelled.`,
      totalTrades,
      winRatePct: totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0,
      maxDrawdownPct: Number(maxDrawdownPct.toFixed(2)),
      netReturnPct: Number(cumulativePnlPct.toFixed(2)),
      disclaimer: 'Simulated historical backtest only. Past or synthetic performance does not guarantee future results.',
    });
  });

  // ==================== TAX ASSISTANT ====================

  app.get('/api/finance/tax/rules', requireAuth, async (_req, res) => {
    res.json({ rules: TAX_RULES_BY_YEAR });
  });

  app.get('/api/finance/tax/history', requireAuth, async (req: AuthRequest, res) => {
    try {
      const rows = await db
        .select()
        .from(taxCalculations)
        .where(eq(taxCalculations.userId, req.dbUser!.id))
        .orderBy(desc(taxCalculations.createdAt))
        .limit(15);
      res.json({ history: rows });
    } catch (err) {
      console.error('Tax history error:', err);
      res.status(500).json({ error: 'Failed to load tax calculations.' });
    }
  });

  app.post('/api/finance/tax/calculate', requireAuth, async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        taxYear: z.string().default('FY 2025-26'),
        grossIncome: z.number().int().min(0),
        sec80C: z.number().int().min(0).max(150000).default(0),
        sec80D: z.number().int().min(0).max(100000).default(0),
        hra: z.number().int().min(0).default(0),
        homeLoanInterest: z.number().int().min(0).max(200000).default(0),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Provide valid non-negative income and deduction figures.' });
      }

      const rule = TAX_RULES_BY_YEAR[parsed.data.taxYear] || TAX_RULES_BY_YEAR['FY 2025-26'];
      const totalOldDeductions =
        rule.standardDeductionOld +
        parsed.data.sec80C +
        parsed.data.sec80D +
        parsed.data.hra +
        parsed.data.homeLoanInterest;
      const taxableOld = Math.max(0, parsed.data.grossIncome - totalOldDeductions);
      const taxableNew = Math.max(0, parsed.data.grossIncome - rule.standardDeductionNew);

      const baseOld = taxableOld <= rule.rebate87AOldLimit ? 0 : computeSlabTax(taxableOld, rule.oldSlabs);
      const baseNew = taxableNew <= rule.rebate87ANewLimit ? 0 : computeSlabTax(taxableNew, rule.newSlabs);

      const oldRegimeTax = Math.round(baseOld * (1 + rule.cessRate));
      const newRegimeTax = Math.round(baseNew * (1 + rule.cessRate));
      const recommendedRegime = newRegimeTax <= oldRegimeTax ? 'New Tax Regime' : 'Old Tax Regime';

      const saved = await db
        .insert(taxCalculations)
        .values({
          userId: req.dbUser!.id,
          taxYear: rule.taxYear,
          grossIncome: parsed.data.grossIncome,
          deductionsJson: {
            sec80C: parsed.data.sec80C,
            sec80D: parsed.data.sec80D,
            hra: parsed.data.hra,
            homeLoanInterest: parsed.data.homeLoanInterest,
          },
          oldRegimeTax,
          newRegimeTax,
          recommendedRegime,
        })
        .returning();

      res.status(201).json({
        calculation: saved[0],
        breakdown: {
          taxYear: rule.taxYear,
          taxableOld,
          taxableNew,
          oldRegimeTax,
          newRegimeTax,
          estimatedSavings: Math.abs(oldRegimeTax - newRegimeTax),
          recommendedRegime,
          assumptions: rule.notes,
        },
      });
    } catch (err) {
      console.error('Tax calculate error:', err);
      res.status(500).json({ error: 'Failed to calculate estimated tax.' });
    }
  });

  // ==================== SMALL BUSINESS FINANCE ====================

  app.get('/api/finance/business/invoices', requireAuth, async (req: AuthRequest, res) => {
    try {
      const invoices = await db
        .select()
        .from(businessInvoices)
        .where(eq(businessInvoices.userId, req.dbUser!.id))
        .orderBy(desc(businessInvoices.createdAt));
      const cashflow = await db
        .select()
        .from(businessCashflow)
        .where(eq(businessCashflow.userId, req.dbUser!.id))
        .orderBy(desc(businessCashflow.entryDate));
      res.json({ invoices, cashflow });
    } catch (err) {
      console.error('Business load error:', err);
      res.status(500).json({ error: 'Failed to load small-business records.' });
    }
  });

  app.post('/api/finance/business/invoices', requireAuth, async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        customerName: z.string().min(2).max(120),
        customerGstin: z.string().max(25).optional().default(''),
        items: z
          .array(
            z.object({
              description: z.string().min(1),
              qty: z.number().int().positive(),
              rate: z.number().int().positive(),
            })
          )
          .min(1),
        gstRate: z.number().int().min(0).max(28).default(18),
        dueDate: z.string().min(4).max(20),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Provide customer name, at least one item, and due date.' });
      }
      const subtotal = parsed.data.items.reduce((s, i) => s + i.qty * i.rate, 0);
      const gstAmount = Math.round((subtotal * parsed.data.gstRate) / 100);
      const totalAmount = subtotal + gstAmount;
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

      const inserted = await db
        .insert(businessInvoices)
        .values({
          userId: req.dbUser!.id,
          invoiceNumber,
          customerName: parsed.data.customerName.trim(),
          customerGstin: parsed.data.customerGstin.trim().toUpperCase(),
          itemsJson: parsed.data.items,
          subtotal,
          gstRate: parsed.data.gstRate,
          gstAmount,
          totalAmount,
          status: 'unpaid',
          dueDate: parsed.data.dueDate,
          isSyntheticDemo: false,
        })
        .returning();

      res.status(201).json({ invoice: inserted[0] });
    } catch (err) {
      console.error('Create invoice error:', err);
      res.status(500).json({ error: 'Failed to create GST invoice.' });
    }
  });

  app.patch('/api/finance/business/invoices/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const status = req.body?.status;
      if (!Number.isInteger(id) || !['paid', 'unpaid', 'overdue'].includes(status)) {
        return res.status(400).json({ error: 'Invalid invoice update.' });
      }
      const updated = await db
        .update(businessInvoices)
        .set({ status })
        .where(and(eq(businessInvoices.id, id), eq(businessInvoices.userId, req.dbUser!.id)))
        .returning();
      if (!updated.length) return res.status(404).json({ error: 'Invoice not found.' });
      res.json({ invoice: updated[0] });
    } catch (err) {
      console.error('Update invoice error:', err);
      res.status(500).json({ error: 'Failed to update invoice.' });
    }
  });

  app.post('/api/finance/business/cashflow', requireAuth, async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        entryDate: z.string().min(4).max(20),
        type: z.enum(['income', 'expense']),
        category: z.string().min(2).max(60),
        description: z.string().min(2).max(200),
        amount: z.number().int().positive(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid cashflow entry.' });
      const inserted = await db
        .insert(businessCashflow)
        .values({
          userId: req.dbUser!.id,
          entryDate: parsed.data.entryDate,
          type: parsed.data.type,
          category: parsed.data.category.trim(),
          description: parsed.data.description.trim(),
          amount: parsed.data.amount,
          isSyntheticDemo: false,
        })
        .returning();
      res.status(201).json({ entry: inserted[0] });
    } catch (err) {
      console.error('Cashflow add error:', err);
      res.status(500).json({ error: 'Failed to save cashflow entry.' });
    }
  });

  // ==================== AI FINANCIAL & SAFETY ASSISTANT ====================

  app.post('/api/ai/assistant', requireAuth, rateLimit(20, 60_000), async (req: AuthRequest, res) => {
    const started = Date.now();
    try {
      const schema = z.object({
        question: z.string().trim().min(1).max(2000),
        includeSavedContext: z.boolean().optional().default(false),
        language: z.enum(['en', 'hi', 'mr']).optional().default('en'),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Please enter a message or question.' });
      }

      let contextSummary: string | undefined;
      if (parsed.data.includeSavedContext) {
        const [txs, holdings, invs] = await Promise.all([
          db.select().from(financialTransactions).where(eq(financialTransactions.userId, req.dbUser!.id)),
          db.select().from(portfolioHoldings).where(eq(portfolioHoldings.userId, req.dbUser!.id)),
          db.select().from(investigations).where(eq(investigations.userId, req.dbUser!.id)),
        ]);
        const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expenses = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const portfolioVal = holdings.reduce((s, h) => s + h.quantity * h.referencePrice, 0);
        contextSummary = `Saved Transactions: ${txs.length} (Income ₹${income}, Expenses ₹${expenses}). Saved Portfolio Holdings: ${holdings.length} (Reference Value ₹${portfolioVal}). Active Scam Investigations: ${invs.length}.`;
      }

      const result = await askFinancialAssistantWithGemini({
        question: parsed.data.question,
        language: parsed.data.language,
        userContextSummary: contextSummary,
      });

      await logAiActivity({
        userId: req.dbUser!.id,
        module: 'ai_assistant',
        modelName: 'gemini-4-hydrogen',
        status: 'success',
        latencyMs: Date.now() - started,
      });

      res.json(result);
    } catch (err: any) {
      await logAiActivity({
        userId: req.dbUser!.id,
        module: 'ai_assistant',
        modelName: 'gemini-4-hydrogen',
        status: 'error',
        latencyMs: Date.now() - started,
        errorMessage: err?.message,
      });
      console.error('AI assistant error:', err);
      res.status(500).json({ error: 'AI Assistant is temporarily unavailable. Please try again.' });
    }
  });

  // ==================== ADMIN CROSS-PORTAL SYNC & MODEL CONFIG ====================

  app.get('/api/admin/investigations', requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
    try {
      const rows = await db
        .select({
          id: investigations.id,
          investigationCode: investigations.investigationCode,
          title: investigations.title,
          suspectedCategory: investigations.suspectedCategory,
          riskLevel: investigations.riskLevel,
          riskScore: investigations.riskScore,
          status: investigations.status,
          isSyntheticDemo: investigations.isSyntheticDemo,
          createdAt: investigations.createdAt,
          citizenEmail: users.email,
          citizenName: users.name,
        })
        .from(investigations)
        .leftJoin(users, eq(investigations.userId, users.id))
        .orderBy(desc(investigations.createdAt))
        .limit(100);
      res.json({ investigations: rows });
    } catch (err) {
      console.error('Admin investigations error:', err);
      res.status(500).json({ error: 'Failed to load investigations.' });
    }
  });

  app.get('/api/admin/evidence', requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
    try {
      const rows = await db
        .select({
          id: evidence.id,
          investigationId: evidence.investigationId,
          evidenceType: evidence.evidenceType,
          title: evidence.title,
          analysisStatus: evidence.analysisStatus,
          analysisSummary: evidence.analysisSummary,
          createdAt: evidence.createdAt,
          citizenEmail: users.email,
        })
        .from(evidence)
        .leftJoin(users, eq(evidence.userId, users.id))
        .orderBy(desc(evidence.createdAt))
        .limit(100);
      res.json({ evidence: rows });
    } catch (err) {
      console.error('Admin evidence error:', err);
      res.status(500).json({ error: 'Failed to load evidence records.' });
    }
  });

  app.get('/api/admin/finance-summary', requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
    try {
      const [txCount, budgetCount, holdingCount, tradeCount, taxCount, invoiceCount] = await Promise.all([
        db.select({ value: count() }).from(financialTransactions),
        db.select({ value: count() }).from(budgets),
        db.select({ value: count() }).from(portfolioHoldings),
        db.select({ value: count() }).from(paperTrades),
        db.select({ value: count() }).from(taxCalculations),
        db.select({ value: count() }).from(businessInvoices),
      ]);
      res.json({
        transactions: Number(txCount[0]?.value || 0),
        budgets: Number(budgetCount[0]?.value || 0),
        portfolioHoldings: Number(holdingCount[0]?.value || 0),
        paperTrades: Number(tradeCount[0]?.value || 0),
        taxCalculations: Number(taxCount[0]?.value || 0),
        businessInvoices: Number(invoiceCount[0]?.value || 0),
      });
    } catch (err) {
      console.error('Admin finance summary error:', err);
      res.status(500).json({ error: 'Failed to load aggregate financial module metrics.' });
    }
  });

  app.get('/api/admin/model-config', requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
    try {
      const rows = await db
        .select()
        .from(modelConfigurations)
        .orderBy(desc(modelConfigurations.createdAt))
        .limit(20);
      res.json({ configurations: rows });
    } catch (err) {
      console.error('Get model config error:', err);
      res.status(500).json({ error: 'Failed to load model configurations.' });
    }
  });

  app.post('/api/admin/model-config', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        versionLabel: z.string().min(2).max(60),
        activeModel: z.enum(['gemini-4-hydrogen', 'gemini-3-flash-preview', 'gemini-2.5-flash']),
        temperature: z.string().min(1).max(10),
        safetyMode: z.enum(['strict_evidence_grounded', 'balanced_educational']),
        notes: z.string().max(400).optional().default(''),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid model configuration payload.' });
      }

      await db.update(modelConfigurations).set({ isActive: false });
      const inserted = await db
        .insert(modelConfigurations)
        .values({
          versionLabel: parsed.data.versionLabel.trim(),
          activeModel: parsed.data.activeModel,
          temperature: parsed.data.temperature,
          safetyMode: parsed.data.safetyMode,
          notes: parsed.data.notes.trim(),
          isActive: true,
          approvedByAdminId: req.dbUser!.id,
        })
        .returning();

      await logAdminAction({
        adminUserId: req.dbUser!.id,
        action: 'model_config_updated',
        targetType: 'model_configuration',
        targetId: inserted[0].id,
        details: { versionLabel: inserted[0].versionLabel, activeModel: inserted[0].activeModel },
        ipAddress: req.ip || '',
      });

      res.status(201).json({ configuration: inserted[0] });
    } catch (err) {
      console.error('Save model config error:', err);
      res.status(500).json({ error: 'Failed to save model configuration.' });
    }
  });
}
