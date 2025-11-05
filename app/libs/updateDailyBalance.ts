import { prisma } from "./prisma";

export async function updateDailyBalances(receiptId: bigint) {
  const receipt = await prisma.customerReceipt.findUnique({
    where: { id: receiptId },
    include: { currencies: true },
  });
  if (!receipt) return;

  const receiptDate = new Date(receipt.receiptDate);
  receiptDate.setHours(0, 0, 0, 0); // normalize date to start of day

  for (const currency of receipt.currencies) {
    // Calculate opening balance = sum of all receipts before this date
    const prevAgg = await prisma.customerReceiptCurrency.aggregate({
      _sum: { amountFcy: true },
      where: {
        currencyType: currency.currencyType,
        receipt: { receiptDate: { lt: receiptDate } },
      },
    });
    const opening = prevAgg._sum.amountFcy ? Number(prevAgg._sum.amountFcy) : 0;

    // Calculate total purchases for this date (all receipts)
    const todayAgg = await prisma.customerReceiptCurrency.aggregate({
      _sum: { amountFcy: true },
      where: {
        currencyType: currency.currencyType,
        receipt: { receiptDate: { gte: receiptDate, lt: new Date(receiptDate.getTime() + 24*60*60*1000) } },
      },
    });
    const totalPurchases = todayAgg._sum.amountFcy ? Number(todayAgg._sum.amountFcy) : 0;

    // Closing = opening + purchases (other fields can be added if needed)
    const closing = opening + totalPurchases;

    // Upsert the daily balance
    const todayBalance = await prisma.dailyCurrencyBalance.findUnique({
      where: { currencyType_date: { currencyType: currency.currencyType, date: receiptDate } },
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
          currencyType: currency.currencyType,
          date: receiptDate,
          openingBalance: opening,
          purchases: totalPurchases,
          closingBalance: closing,
        },
      });
    }
  }
}
