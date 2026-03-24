import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getFile } from "@/lib/storage";

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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ facilityId: string; jobId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { facilityId, jobId } = await params;
  const facility = await checkAccess(facilityId, session.user.id);
  if (!facility) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const job = await prisma.exportJob.findFirst({
    where: { id: jobId, facilityId },
    include: { artifacts: true },
  });

  if (!job || job.artifacts.length === 0) {
    return NextResponse.json({ error: "No artifacts" }, { status: 404 });
  }

  const artifact = job.artifacts[0];
  const buffer = await getFile(artifact.storageKey);
  if (!buffer) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const contentType = artifact.mimeType || "application/octet-stream";
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${artifact.fileName}"`,
    },
  });
}
