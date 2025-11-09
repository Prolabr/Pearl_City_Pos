import { NextResponse } from "next/server";
import { cleanupOldPDFs } from "../../../libs/cleanUpPDFs";

export async function DELETE() {
  try {
    const result = await cleanupOldPDFs(0); // 0 = delete all PDFs immediately
    return NextResponse.json({
      message: `Deleted ${result.deletedFiles} files and ${result.deletedDBRecords} records.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete PDFs." }, { status: 500 });
  }
}
