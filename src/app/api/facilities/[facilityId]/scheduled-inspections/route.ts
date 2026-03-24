import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function checkAccess(facilityId: string, userId: string) {
  return prisma.facility.findFirst({
    where: {
      id: facilityId,
      OR: [
        { organization: { memberships: { some: { userId, role: "ORG_ADMIN" } } } },
        { memberships: { some: { userId } } },
      ],
    },
    select: { id: true },
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ facilityId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { facilityId } = await params;
  const facility = await checkAccess(facilityId, session.user.id);
  if (!facility) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();

  const scheduled = await prisma.scheduledInspection.create({
    data: {
      facilityId,
      templateId: body.templateId,
      assetId: body.assetId || null,
      dueDate: new Date(body.dueDate),
      recurrenceRule: body.recurrenceRule || null,
      assignedUserId: body.assignedUserId || null,
      status: "scheduled",
      priority: body.priority || null,
    },
  });

  return NextResponse.json({ scheduledInspectionId: scheduled.id });
}
