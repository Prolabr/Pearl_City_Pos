import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../libs/prisma"; // adjust path to your prisma client

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      serialNo,
      date,
      customerName,
      nicPassport,
      sources,
      otherSource,
      rows,
    }: {
      serialNo: string;
      date: string;
      customerName: string;
      nicPassport: string;
      sources: string[];
      otherSource: string;
      rows: {
        currencyType: string;
        amountReceived: string;
        rate: string;
        amountIssued: string;
      }[];
    } = body;

    // Validate required fields
    if (!serialNo || !customerName || !nicPassport || sources.length === 0) {
      return NextResponse.json(
        { error: "Please fill in all required fields" },
        { status: 400 }
      );
    }

    // Filter out empty rows
    const validRows = rows.filter(
      (r) =>
        r.currencyType.trim() !== "" &&
        (r.amountReceived.trim() !== "" || r.rate.trim() !== "")
    );

    // If no valid rows, return error
    if (validRows.length === 0) {
      return NextResponse.json(
        { error: "Please enter at least one currency row" },
        { status: 400 }
      );
    }

    // Save receipt and its currencies
    const receipt = await prisma.customerReceipt.create({
      data: {
        serialNumber: serialNo,
        receiptDate: new Date(date),
        customerName,
        nicPassport,
        sourceOfForeignCurrency: sources.join(", "),
        remarks: otherSource,
        currencies: {
          create: rows.map((r) => ({
            currencyType: r.currencyType,
            amountFcy: parseFloat(r.amountReceived) || 0,
            rateOffered: parseFloat(r.rate) || 0,
            amountIssuedLkr: parseFloat(r.amountIssued) || 0,
          })),
        },
      },
    });

    return NextResponse.json({
      message: "Receipt saved successfully",
      receipt: {
    ...receipt,
    id: receipt.id.toString(), // Convert BigInt to string
    currencies: receipt.currencies?.map((c : { id: bigint; receiptId: bigint; [key: string]: any }) => ({
      ...c,
      id: c.id.toString(),
      receiptId: c.receiptId.toString(),
    })),
  },
    });
  } catch (err: any) {
    // Unique constraint violation on serial number
    if (err.code === "P2002" && err.meta?.target?.includes("serialNumber")) {
      return NextResponse.json(
        { error: "Serial number already exists" },
        { status: 409 }
      );
    }

    console.error(err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
