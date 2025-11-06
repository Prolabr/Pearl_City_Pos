import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../libs/prisma";
import { toDayDate } from "../../../libs/day";

export async function POST(req: NextRequest) {
  try {
    const { currencyType, date, deposits } = await req.json();

    if (!currencyType || !date)
      return NextResponse.json({ error: "Missing data" }, { status: 400 });

    const day = toDayDate(date);
    const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);

    let daily = await prisma.dailyCurrencyBalance.findUnique({
      where: { currencyType_date: { currencyType, date: day } },
    });

    if (!daily) {
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

    const closing =
      Number(daily.openingBalance || 0) +
      Number(daily.purchases || 0) +
      Number(daily.exchangeBuy || 0) -
      Number(daily.exchangeSell || 0) -
      Number(daily.sales || 0) -
      Number(deposits || 0);

    await prisma.dailyCurrencyBalance.update({
      where: { id: daily.id },
      data: {
        deposits,
        closingBalance: closing,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
