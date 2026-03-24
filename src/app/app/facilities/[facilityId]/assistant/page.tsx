import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ComplianceAssistant } from "@/components/assistant/ComplianceAssistant";

async function checkAccess(facilityId: string, userId: string) {
  return prisma.facility.findFirst({
    where: {
      id: facilityId,
      OR: [
        { organization: { memberships: { some: { userId, role: "ORG_ADMIN" } } } },
        { memberships: { some: { userId } } },
      ],
    },
    select: { id: true, name: true },
  });
}

export default async function AssistantPage({
  params,
}: {
  params: Promise<{ facilityId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { facilityId } = await params;
  const facility = await checkAccess(facilityId, session.user.id);
  if (!facility) notFound();

  const configured = !!process.env.OPENAI_API_KEY;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Assistant
        </h1>
        <p className="text-[var(--muted)] mt-1">
          Ask questions about SPCC compliance and your data in ContainPoint for{" "}
          <span className="font-medium text-[var(--foreground)]">{facility.name}</span>.
        </p>
      </div>

      {!configured && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Not configured:</strong> set <code className="font-mono text-xs">OPENAI_API_KEY</code> in
          your environment. After deployment, run{" "}
          <code className="font-mono text-xs">npm run ingest:knowledge</code> to load RAG documents.
        </div>
      )}

      <ComplianceAssistant facilityId={facilityId} />
    </div>
  );
}
