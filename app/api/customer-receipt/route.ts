import { NextResponse } from "next/server";
import { prisma } from "../../libs/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      serialNumber,
      receiptDate,
      customerName,
      nicPassport,
      sources,
      otherSource,
      rows,
    } = body;

    if (!serialNumber || !customerName || !nicPassport || !rows?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Combine sources into a string
    const sourceString = sources.includes("other")
      ? [...sources.filter((s: string) => s !== "other"), otherSource].join(", ")
      : sources.join(",");

    // Insert each row as a CustomerReceipt entry
    const createdReceipts = await prisma.$transaction(
      rows.map((r: any) =>
        prisma.customerReceipt.create({
          data: {
            serialNumber,
            receiptDate: new Date(receiptDate),
            customerName,
            nicPassport,
            sourceOfForeignCurrency: sourceString,
            currencyType: r.currencyType, // directly store the code here
            amountFcy: r.amountReceived ? parseFloat(r.amountReceived) : 0,
            rateOffered: r.rate ? parseFloat(r.rate) : 0,
            amountIssuedLkr: r.amountIssued ? parseFloat(r.amountIssued) : 0,
            remarks: "",
          },
        })
      )
    );

    return NextResponse.json(
      { message: "Receipts saved successfully", data: createdReceipts },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error saving receipt", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
