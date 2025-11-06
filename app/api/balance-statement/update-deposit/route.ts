// app/api/balance-statement/update-deposit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../libs/prisma";
import { toDayDate } from "../../../libs/day";

export async function POST(req: NextRequest) {
  try {
    const { currencyType, date, amount } = await req.json();

    if (!currencyType || !date || amount === undefined) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const depositAmount = Number(amount);
    if (isNaN(depositAmount)) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const day = toDayDate(date);

    // 1) Insert audit record
    await prisma.depositRecord.create({
      data: {
        currencyType,
        amount: depositAmount,
        date: day,
      },
    });

    // 2) Aggregate day deposits
    const agg = await prisma.depositRecord.aggregate({
      _sum: { amount: true },
      where: { currencyType, date: day },
    });

    const totalDeposits = Number(agg._sum.amount ?? 0);

    // 3) Find or create daily row
    let daily = await prisma.dailyCurrencyBalance.findUnique({
      where: { currencyType_date: { currencyType, date: day } },
    });

    if (!daily) {
      // Find previous day
      const prevDay = new Date(day.getTime() - 24 * 60 * 60 * 1000);
      const prev = await prisma.dailyCurrencyBalance.findUnique({
        where: { currencyType_date: { currencyType, date: prevDay } },
      });

      const openingBalance = Number(prev?.closingBalance ?? 0);

      // ✅ FIX: wrap Decimal in Number()
      const closingBalance = Number(openingBalance) - Number(totalDeposits);

      daily = await prisma.dailyCurrencyBalance.create({
        data: {
          currencyType,
          date: day,
          openingBalance,
          purchases: 0,
          exchangeBuy: 0,
          exchangeSell: 0,
          sales: 0,
          deposits: totalDeposits,
          closingBalance,
        },
      });
    } else {
      // 4) update existing row
      const closing =
        Number(daily.openingBalance ?? 0) +
        Number(daily.purchases ?? 0) +
        Number(daily.exchangeBuy ?? 0) -
        Number(daily.exchangeSell ?? 0) -
        Number(daily.sales ?? 0) -
        Number(totalDeposits);

      await prisma.dailyCurrencyBalance.update({
        where: { id: daily.id },
        data: {
          deposits: totalDeposits,
          closingBalance: closing,
        },
      });
    }

    // Fetch today's updated closing
    let current = await prisma.dailyCurrencyBalance.findUnique({
      where: { currencyType_date: { currencyType, date: day } },
    });

    let currentClosing = Number(current?.closingBalance ?? 0);
    let currentDay = day;

    // 5) forward propagation
    while (true) {
      const nd = new Date(currentDay.getTime() + 86400000);

      const next = await prisma.dailyCurrencyBalance.findUnique({
        where: { currencyType_date: { currencyType, date: nd } },
      });

      if (!next) break;

      const nextClosing =
        Number(currentClosing) +
        Number(next.purchases ?? 0) +
        Number(next.exchangeBuy ?? 0) -
        Number(next.exchangeSell ?? 0) -
        Number(next.sales ?? 0) -
        Number(next.deposits ?? 0);

      await prisma.dailyCurrencyBalance.update({
        where: { id: next.id },
        data: {
          openingBalance: currentClosing,
          closingBalance: nextClosing,
        },
      });

      currentDay = nd;
      currentClosing = nextClosing;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("update-deposit error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
