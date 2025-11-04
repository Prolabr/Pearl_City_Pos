import { prisma } from "../app/libs/prisma";
import bcrypt from "bcrypt";

async function main() {
  const emails = [
    "abc@gmail.com"
  ];

  for (const email of emails) {
    const passwordHash = await bcrypt.hash("12345678", 10);

    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash
      }
    });
  }
}

main();
