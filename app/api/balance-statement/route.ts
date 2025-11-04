// app/api/balance-statement/route.ts
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "../../libs/prisma"; 


// List of the 9 currencies accepted by the app
const CURRENCIES = [
  "USD",
  "GBP",
  "EUR",
  "CHF",
  "AUD",
  "NZD",
  "SGD",
  "INR",
  "CAD",
];


export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fromDateParam = searchParams.get("fromDate");
    const toDateParam = searchParams.get("toDate");

    if (!fromDateParam || !toDateParam) {
      return NextResponse.json({ error: "Missing date range" }, { status: 400 });
    }

    const from = new Date(fromDateParam);
    const to = new Date(toDateParam);
    // Make the `to` inclusive to the end of that day
    to.setHours(23, 59, 59, 999);

    // Helper to safely convert Prisma Decimal | null -> number
    const decimalToNumber = (val: any) => {
      if (val === null || val === undefined) return 0;
      // Prisma returns Decimal which usually has .toNumber() or .toString()
      if (typeof val.toNumber === "function") return val.toNumber();
      if (typeof val.toString === "function") return parseFloat(val.toString());
      return Number(val);
    };

    const results: Array<Record<string, string>> = [];

    // For each supported currency compute sums
    for (const currency of CURRENCIES) {
      // Sum of ALL previous transactions (before `from`) -> opening balance
      const openingAgg = await prisma.customerReceiptCurrency.aggregate({
        _sum: {
          amountFcy: true,
        },
        where: {
          currencyType: currency,
          receipt: {
            receiptDate: { lt: from },
          },
        },
      });

      // Sum of transactions inside the requested range -> purchases
      const purchasesAgg = await prisma.customerReceiptCurrency.aggregate({
        _sum: {
          amountFcy: true,
        },
        where: {
          currencyType: currency,
          receipt: {
            receiptDate: { gte: from, lte: to },
          },
        },
      });

      // NOTE: at the moment other fields (exchangeBuy, exchangeSell, sales, deposits)
      // are not represented in the CustomerReceipt model. We set them to 0 here.
      // In future you can replace these with aggregates from their respective tables
      // (purchase register, exchange transactions, sales register, deposit register).

      const opening = decimalToNumber(openingAgg._sum.amountFcy);
      const purchases = decimalToNumber(purchasesAgg._sum.amountFcy);
      const exchangeBuy = 0;
      const exchangeSell = 0;
      const sales = 0;
      const deposits = 0;

      const closing = opening + purchases + exchangeBuy - exchangeSell - sales - deposits;

      results.push({
        currencyType: currency,
        openingBalance: opening.toFixed(2),
        purchases: purchases.toFixed(2),
        exchangeBuy: exchangeBuy.toFixed(2),
        exchangeSell: exchangeSell.toFixed(2),
        sales: sales.toFixed(2),
        deposits: deposits.toFixed(2),
        closingBalance: closing.toFixed(2),
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("balance-statement error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}