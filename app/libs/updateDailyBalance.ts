import { prisma } from "./prisma";
import { toDayDate } from "./day";

export async function updateDailyBalances(receiptId: bigint) {
  // 1. Fetch receipt and associated currency line items
  const receipt = await prisma.customerReceipt.findUnique({
    where: { id: receiptId },
    include: { currencies: true }, // Assumes 'currencies' links to CustomerReceiptCurrency
  });
  if (!receipt) return;

  const receiptDate = toDayDate(receipt.receiptDate);
  const nextDay = new Date(receiptDate.getTime() + 24 * 60 * 60 * 1000);

  // 2. Get unique currency types to avoid unnecessary repetition if the receipt has multiple line items for the same currency
  const distinctCurrencyTypes = Array.from(new Set(receipt.currencies.map(c => c.currencyType)));

  for (const currencyType of distinctCurrencyTypes) {
    // --- STEP A: Calculate Opening Balance from YESTERDAY's Closing Balance ---
    // This is the production-ready change: use the last recorded balance, not re-aggregate all history.
    const yesterdayBalance = await prisma.dailyCurrencyBalance.findFirst({
      where: {
        currencyType: currencyType,
        date: { lt: receiptDate }, // Find balances calculated BEFORE today
      },
      orderBy: {
        date: 'desc', // Get the most recent balance (yesterday)
      },
      select: {
        closingBalance: true
      }
    });
    
    // Set opening to yesterday's closing, or 0 if no prior balance exists.
    const opening = yesterdayBalance?.closingBalance ? Number(yesterdayBalance.closingBalance) : 0;

    // --- STEP B: Aggregate TODAY's Purchases ---
    const todayAgg = await prisma.customerReceiptCurrency.aggregate({
      _sum: { amountFcy: true },
      where: {
        currencyType: currencyType,
        receipt: { receiptDate: { gte: receiptDate, lt: nextDay } },
      },
    });
    const totalPurchases = todayAgg._sum.amountFcy
      ? Number(todayAgg._sum.amountFcy)
      : 0;
      
    // --- STEP C: Guard Clause (Only process if there is activity) ---
    // This stops creating/updating records for currencies with no movement.
    if (opening === 0 && totalPurchases === 0) {
      continue; 
    }

    const closing = opening + totalPurchases;

    // --- STEP D: Upsert (Update or Create) the DailyCurrencyBalance ---
    const todayBalance = await prisma.dailyCurrencyBalance.findUnique({
      where: {
        currencyType_date: {
          currencyType: currencyType,
          date: receiptDate,
        },
      },
    });

    if (todayBalance) {
      await prisma.dailyCurrencyBalance.update({
        where: { id: todayBalance.id },
        data: {
          openingBalance: opening,
          purchases: totalPurchases,
          closingBalance: closing,
        },
      });
    } else {
      await prisma.dailyCurrencyBalance.create({
        data: {
          currencyType: currencyType,
          date: receiptDate,
          openingBalance: opening,
          purchases: totalPurchases,
          closingBalance: closing,
        },
      });
    }
  }
}