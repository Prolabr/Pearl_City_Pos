// app/api/balance-statement/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../libs/prisma"; 

export async function POST(req: NextRequest) {
  try {
    const { startDate, endDate } = await req.json();

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "startDate and endDate required" }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // 1) Opening balances per currency (all receipts before start)
    const openingRaw = await prisma.customerReceiptCurrency.groupBy({
      by: ["currencyType"],
      where: {
        receipt: {
          receiptDate: { lt: start },
        },
      },
      _sum: {
        amountFcy: true,
      },
    });

    // 2) Purchases per currency (receipts inside the date range)
    const purchasesRaw = await prisma.customerReceiptCurrency.groupBy({
      by: ["currencyType"],
      where: {
        receipt: {
          receiptDate: { gte: start, lte: end },
        },
      },
      _sum: {
        amountFcy: true,
      },
    });

    // convert to maps for easy merging
    const openingMap = new Map<string, number>();
    for (const r of openingRaw) {
      openingMap.set(r.currencyType, Number(r._sum.amountFcy ?? 0));
    }
    const purchasesMap = new Map<string, number>();
    for (const r of purchasesRaw) {
      purchasesMap.set(r.currencyType, Number(r._sum.amountFcy ?? 0));
    }

    // 3) Gather list of currencies seen in either opening or purchases
    const currencySet = new Set<string>();
    openingMap.forEach((_, k) => currencySet.add(k));
    purchasesMap.forEach((_, k) => currencySet.add(k));

    // 4) Placeholder: Query Exchange-Buy, Exchange-Sell, Sales, Deposits
    // TODO: Replace these placeholders with real queries to your tables.
    // For now we return 0 for those, so the result will be correct for receipts-only flows.
    // Example if you have a table `exchangeTransactions` with fields currencyType, amount, type ('buy'|'sell'):
    //   const exchangeBuyRaw = await prisma.exchangeTransactions.groupBy({ by: ['currencyType'], where: { date: { gte: start, lte: end }, type: 'buy' }, _sum: { amount: true } });

    const rows: Array<any> = [];

    for (const currency of Array.from(currencySet)) {
      const opening = openingMap.get(currency) ?? 0;
      const purchases = purchasesMap.get(currency) ?? 0;

      // placeholders — replace with real values from your other models
      const exchangeBuy = 0;
      const exchangeSell = 0;
      const sales = 0;
      const deposits = 0;

      const closing = opening + purchases + exchangeBuy - exchangeSell - sales - deposits;

      rows.push({
        currencyType: currency,
        openingBalance: opening,
        purchases: purchases,
        exchangeBuy,
        exchangeSell,
        sales,
        deposits,
        closingBalance: closing,
      });
    }

    // Sort rows by currency name for predictability
    rows.sort((a, b) => (a.currencyType > b.currencyType ? 1 : -1));

    return NextResponse.json({ startDate, endDate, rows });
  } catch (err) {
    console.error("Error in balance-statement:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
