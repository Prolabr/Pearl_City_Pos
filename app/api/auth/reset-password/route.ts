import { prisma } from "@/app/libs/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { token, password } = await req.json();

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetExpires: { gt: new Date() }
    }
  });

  if (!user) {
    return NextResponse.json({ message: "Invalid or expired token" });
  }

  const hash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hash,
      resetToken: null,
      resetExpires: null
    }
  });

  return NextResponse.json({ message: "Password updated successfully." });
}
