import { NextResponse } from "next/server";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

const RegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organizationName: z.string().min(1, "Organization name is required"),
});

export async function POST(req: Request) {
  try {
    const ip = getClientIdentifier(req);
    const rateLimit = checkRateLimit(`register:${ip}`, 5);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: { form: "Too many registration attempts. Please try again later." } },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
      );
    }

    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { name, email, password, organizationName } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: { email: ["Email already registered"] } }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const orgSlug = slugify(organizationName);
    const existingOrg = await prisma.organization.findUnique({ where: { slug: orgSlug } });
    const finalSlug = existingOrg ? `${orgSlug}-${Date.now().toString(36)}` : orgSlug;

    const [user, org] = await prisma.$transaction([
      prisma.user.create({
        data: { name, email, passwordHash },
      }),
      prisma.organization.create({
        data: { name: organizationName, slug: finalSlug },
      }),
    ]);

    await prisma.organizationMembership.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: "ORG_ADMIN",
      },
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
