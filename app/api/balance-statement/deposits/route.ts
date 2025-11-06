// app/api/balance-statement/deposits/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/libs/prisma";
import { toDayDate } from "@/app/libs/day";

export async function GET(req: NextRequest) {
  try {
    const currency = req.nextUrl.searchParams.get("currency");
    const date = req.nextUrl.searchParams.get("date");

    if (!currency || !date) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const day = toDayDate(date);

    const deposits = await prisma.depositRecord.findMany({
      where: { currencyType: currency, date: day },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(deposits);
  } catch (err) {
    console.error("Fetch deposits error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
