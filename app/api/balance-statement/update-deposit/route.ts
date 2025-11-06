import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../libs/prisma";
import { toDayDate } from "../../../libs/day";

export async function POST(req: NextRequest) {
  try {
    const { currencyType, date, deposits } = await req.json();

    if (!currencyType || !date)
      return NextResponse.json({ error: "Missing data" }, { status: 400 });

    // Normalize date to 00:00
    const day = toDayDate(date);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(0, 0, 0, 0);


    //Get today's balance record (must already exist)
    let daily = await prisma.dailyCurrencyBalance.findUnique({
      where: { currencyType_date: { currencyType, date: day } },
    });

    if (!daily) {
      // create default record if missing
      daily = await prisma.dailyCurrencyBalance.create({
        data: {
          currencyType,
          date: day,
          openingBalance: 0,
          purchases: 0,
          deposits: 0,
          closingBalance: 0,
        },
      });
    }

    // Recalculate closing balance
    const closing =
      Number(daily.openingBalance) +
      Number(daily.purchases) +
      Number(daily.exchangeBuy) -
      Number(daily.exchangeSell) -
      Number(daily.sales) -
      Number(deposits);

    // Update record
    await prisma.dailyCurrencyBalance.update({
      where: { id: daily.id },
      data: {
        deposits,
        closingBalance: closing,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update deposit error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}