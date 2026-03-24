import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { saveFile, getFileExtension } from "@/lib/storage";
import { createHash } from "crypto";
import { FileObjectType } from "@/generated/prisma/enums";

async function checkAccess(facilityId: string, userId: string) {
  return prisma.facility.findFirst({
    where: {
      id: facilityId,
      OR: [
        { organization: { memberships: { some: { userId, role: "ORG_ADMIN" } } } },
        { memberships: { some: { userId } } },
      ],
    },
  });
}

const OBJECT_TYPES: FileObjectType[] = ["FACILITY", "ASSET", "CONTAINMENT_UNIT"];

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

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const objectType = formData.get("objectType") as string;
  const objectId = formData.get("objectId") as string;
  const caption = formData.get("caption") as string | null;

  if (!file || !objectType || !objectId) {
    return NextResponse.json(
      { error: "file, objectType, and objectId are required" },
      { status: 400 }
    );
  }

  if (!OBJECT_TYPES.includes(objectType as FileObjectType)) {
    return NextResponse.json({ error: "Invalid objectType" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = getFileExtension(file.type);
  const storageKey = await saveFile(buffer, ext);
  const checksum = createHash("sha256").update(buffer).digest("hex");

  const fileAsset = await prisma.fileAsset.create({
    data: {
      facilityId,
      objectType: objectType as FileObjectType,
      objectId,
      fileName: file.name,
      mimeType: file.type,
      storageKey,
      checksum,
      uploadedByUserId: session.user.id,
      caption: caption || null,
    },
  });

  await recordAuditEvent({
    organizationId: facility.organizationId,
    facilityId,
    actorUserId: session.user.id,
    objectType: "FileAsset",
    objectId: fileAsset.id,
    action: "file.uploaded",
    afterJson: { fileName: file.name, objectType, objectId },
  });

  return NextResponse.json({
    id: fileAsset.id,
    fileName: fileAsset.fileName,
    objectType: fileAsset.objectType,
    objectId: fileAsset.objectId,
  });
}
