import fs from "fs";
import path from "path";
import { NextResponse, NextRequest } from "next/server"; // Use NextRequest for type safety
import { prisma } from "@/app/libs/prisma"; // Adjust the path to your prisma client

/**
 * Handles POST requests to save a Base64 encoded PDF to the server filesystem
 * and record the file path in the database.
 * @param req The incoming NextRequest containing receiptId, fileName, and pdfBase64.
 * @returns A JSON response indicating success or failure.
 */
export async function POST(req: NextRequest) {
  try {
    // Destructure the expected fields from the request body
    const { receiptId, fileName, pdfBase64 } = await req.json();

    if (!receiptId || !fileName || !pdfBase64) {
      return NextResponse.json(
        { error: "Missing required fields (receiptId, fileName, pdfBase64)" },
        { status: 400 }
      );
    }

    // --- 1. Define Paths and Create Folder ---
    // The path where the file will be publicly accessible (e.g., /public/pdf)
    const folderPath = path.join(process.cwd(), "public", "pdf");
    
    // Ensure the directory exists
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    // The full path to save the file on the server
    const filePath = path.join(folderPath, fileName);

    // --- 2. Decode and Save File ---
    const buffer = Buffer.from(pdfBase64, "base64");
    
    // Save the file synchronously (blocking, suitable for API routes)
    fs.writeFileSync(filePath, buffer);

    // --- 3. Save Record to Database ---
    // Convert BigInt to string before using it if necessary, 
    // but in this context, BigInt(receiptId) ensures correct type conversion
    await prisma.receiptPDF.create({
      data: {
        receiptId: BigInt(receiptId), // Convert the string ID back to BigInt
        fileName,
        filePath: `/pdf/${fileName}`, // Publicly accessible URL path
      },
    });

    return NextResponse.json({ message: "PDF saved successfully", filePath: `/pdf/${fileName}` });
  } catch (err) {
    console.error("Error saving PDF:", err);
    return NextResponse.json({ error: "Server error occurred while saving the PDF" }, { status: 500 });
  }
}