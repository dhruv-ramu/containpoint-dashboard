import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const CreateFacilitySchema = z.object({
  name: z.string().min(1),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgMembership = await prisma.organizationMembership.findFirst({
    where: { userId: session.user.id },
  });
  if (!orgMembership || !["ORG_ADMIN", "FACILITY_MANAGER"].includes(orgMembership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = CreateFacilitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { name, addressLine1, city, state, postalCode } = parsed.data;
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 0;
  while (
    await prisma.facility.findFirst({
      where: { organizationId: orgMembership.organizationId, slug },
    })
  ) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  const facility = await prisma.facility.create({
    data: {
      organizationId: orgMembership.organizationId,
      name,
      slug,
      status: "DRAFT",
    },
  });

  if (addressLine1 || city || state || postalCode) {
    await prisma.facilityProfile.create({
      data: {
        facilityId: facility.id,
        addressLine1: addressLine1 ?? null,
        city: city ?? null,
        state: state ?? null,
        postalCode: postalCode ?? null,
      },
    });
  }

  await prisma.facilityMembership.create({
    data: {
      facilityId: facility.id,
      userId: session.user.id,
      role: orgMembership.role === "ORG_ADMIN" ? "FACILITY_MANAGER" : orgMembership.role,
    },
  });

  await recordAuditEvent({
    organizationId: orgMembership.organizationId,
    facilityId: facility.id,
    actorUserId: session.user.id,
    objectType: "Facility",
    objectId: facility.id,
    action: "facility.created",
    afterJson: { name, slug, status: facility.status },
  });

  return NextResponse.json({ facilityId: facility.id });
}
