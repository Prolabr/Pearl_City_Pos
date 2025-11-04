import { prisma } from "@/app/libs/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  const { email } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ message: "If email exists, link sent." });
  }

  const token = crypto.randomBytes(32).toString("hex");

  await prisma.user.update({
    where: { email },
    data: {
      resetToken: token,
      resetExpires: new Date(Date.now() + 1000 * 60 * 15) // 15 mins
    }
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password/${token}`;

  // TODO: Send email
  console.log("RESET URL:", resetUrl);

  return NextResponse.json({
    message: "Reset link generated. (Check server logs)"
  });
}
