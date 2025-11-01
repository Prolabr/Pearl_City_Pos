import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../libs/prisma"; // adjust path to your prisma client
import { Decimal } from "@prisma/client/runtime/library";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    if (!fromDate || !toDate) {
      return NextResponse.json({ error: "Missing date range" }, { status: 400 });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    // --- Opening Balances (before fromDate) ---
    const openings = await prisma.customerReceiptCurrency.groupBy({
      by: ["currencyType"],
      where: {
        receipt: {
          receiptDate: {
            lt: from,
          },
        },
      },
      _sum: { amountFcy: true },
    });

    // --- Purchases during the selected period ---
    const purchases = await prisma.customerReceiptCurrency.groupBy({
      by: ["currencyType"],
      where: {
        receipt: {
          receiptDate: {
            gte: from,
            lte: to,
          },
        },
      },
      _sum: { amountFcy: true },
    });

    // Merge and compute
    const balanceMap: Record<
      string,
      {
        currencyType: string;
        openingBalance: number;
        purchases: number;
        exchangeBuy: number;
        exchangeSell: number;
        sales: number;
        deposits: number;
        closingBalance: number;
      }
    > = {};

    // Add opening balances
    openings.forEach((o) => {
      balanceMap[o.currencyType] = {
        currencyType: o.currencyType,
        openingBalance: Number(o._sum.amountFcy ?? 0),
        purchases: 0,
        exchangeBuy: 0,
        exchangeSell: 0,
        sales: 0,
        deposits: 0,
        closingBalance: 0,
      };
    });

    // Add purchases
    purchases.forEach((p) => {
      if (!balanceMap[p.currencyType]) {
        balanceMap[p.currencyType] = {
          currencyType: p.currencyType,
          openingBalance: 0,
          purchases: 0,
          exchangeBuy: 0,
          exchangeSell: 0,
          sales: 0,
          deposits: 0,
          closingBalance: 0,
        };
      }
      balanceMap[p.currencyType].purchases = Number(p._sum.amountFcy ?? 0);
    });

    // Compute closing balances
    Object.values(balanceMap).forEach((b) => {
      b.closingBalance =
        b.openingBalance +
        b.purchases +
        b.exchangeBuy -
        b.exchangeSell -
        b.sales -
        b.deposits;
    });

    const results = Object.values(balanceMap);

    return NextResponse.json(results);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
