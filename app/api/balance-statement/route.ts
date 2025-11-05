import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../libs/prisma";

const CURRENCIES = ["USD","GBP","EUR","CHF","AUD","NZD","SGD","INR","CAD"];

type CurrencyBalance = {
  currencyType: string;
  openingBalance: string;
  purchases: string;
  exchangeBuy: string;
  exchangeSell: string;
  sales: string;
  deposits: string;
  closingBalance: string;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fromDateParam = searchParams.get("fromDate");
    const toDateParam = searchParams.get("toDate");

    if (!fromDateParam || !toDateParam) {
      return NextResponse.json({ error: "Missing date range" }, { status: 400 });
    }

    const from = new Date(fromDateParam);
    const to = new Date(toDateParam);
    to.setHours(23, 59, 59, 999);

    const results: CurrencyBalance[] = [];

    for (const currency of CURRENCIES) {
      // Opening balance = sum of all receipts **before fromDate**
      const openingAgg = await prisma.customerReceiptCurrency.aggregate({
        _sum: { amountFcy: true },
        where: {
          currencyType: currency,
          receipt: { receiptDate: { lt: from } },
        },
      });

      // Purchases in the selected date range
      const purchasesAgg = await prisma.customerReceiptCurrency.aggregate({
        _sum: { amountFcy: true },
        where: {
          currencyType: currency,
          receipt: { receiptDate: { gte: from, lte: to } },
        },
      });

      const opening = openingAgg._sum.amountFcy ? Number(openingAgg._sum.amountFcy) : 0;
      const purchases = purchasesAgg._sum.amountFcy ? Number(purchasesAgg._sum.amountFcy) : 0;

      // At the moment other fields are not tracked in your DB, set to 0
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
  } catch (err) {
    console.error("balance-statement error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
