import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";
import { OilTypeCategory, UserRole, FacilityStatus } from "../src/generated/prisma/enums";
import * as bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL required for seed");

const isAccelerate =
  url.startsWith("prisma://") || url.startsWith("prisma+postgres://");

const prisma = isAccelerate
  ? (new PrismaClient({
      accelerateUrl: url,
    }).$extends(withAccelerate()) as unknown as InstanceType<typeof PrismaClient>)
  : new PrismaClient({
      adapter: new PrismaPg({ connectionString: url }),
    });

async function main() {
  // Seed oil types
  const oilTypes = [
    { label: "Diesel", category: OilTypeCategory.DIESEL },
    { label: "Gasoline", category: OilTypeCategory.GASOLINE },
    { label: "Hydraulic Oil", category: OilTypeCategory.HYDRAULIC },
    { label: "Lube Oil", category: OilTypeCategory.LUBE },
    { label: "Used Oil", category: OilTypeCategory.USED_OIL },
    { label: "Transformer Oil", category: OilTypeCategory.TRANSFORMER },
    { label: "Crude Oil", category: OilTypeCategory.CRUDE },
    { label: "Other", category: OilTypeCategory.OTHER },
  ];

  for (const ot of oilTypes) {
    const existing = await prisma.oilType.findFirst({ where: { label: ot.label } });
    if (!existing) {
      await prisma.oilType.create({ data: { label: ot.label, category: ot.category, active: true } });
    }
  }

  // Create seed org and user for demo
  const passwordHash = await bcrypt.hash("demo1234", 10);
  const user = await prisma.user.upsert({
    where: { email: "admin@containpoint.com" },
    create: {
      name: "Demo Admin",
      email: "admin@containpoint.com",
      passwordHash,
    },
    update: {},
  });

  const org = await prisma.organization.upsert({
    where: { slug: "demo-org" },
    create: {
      name: "Demo Organization",
      slug: "demo-org",
    },
    update: {},
  });

  await prisma.organizationMembership.upsert({
    where: {
      userId_organizationId: { userId: user.id, organizationId: org.id },
    },
    create: {
      userId: user.id,
      organizationId: org.id,
      role: UserRole.ORG_ADMIN,
    },
    update: {},
  });

  const facility = await prisma.facility.upsert({
    where: {
      organizationId_slug: { organizationId: org.id, slug: "main-site" },
    },
    create: {
      organizationId: org.id,
      name: "Main Site",
      slug: "main-site",
      status: FacilityStatus.ACTIVE,
    },
    update: {},
  });

  await prisma.facilityMembership.upsert({
    where: {
      facilityId_userId: { facilityId: facility.id, userId: user.id },
    },
    create: {
      facilityId: facility.id,
      userId: user.id,
      role: UserRole.FACILITY_MANAGER,
    },
    update: {},
  });

  console.log("Seed complete. Oil types, demo org, user, and facility created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
