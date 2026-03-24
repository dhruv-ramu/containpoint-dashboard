import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { InspectionTemplateForm } from "../../template-form";

async function getFacility(facilityId: string, userId: string) {
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

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ facilityId: string; templateId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { facilityId, templateId } = await params;
  const facility = await getFacility(facilityId, session.user.id);
  if (!facility) notFound();

  const template = await prisma.inspectionTemplate.findFirst({
    where: {
      id: templateId,
      organizationId: facility.organizationId,
      OR: [{ facilityId: null }, { facilityId }],
    },
    include: {
      versions: {
        where: { active: true },
        orderBy: { version: "desc" },
        take: 1,
        include: { items: { orderBy: { sequenceOrder: "asc" } } },
      },
    },
  });

  if (!template) notFound();

  const version = template.versions[0];
  const items = version?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Edit inspection template
        </h1>
        <p className="text-[var(--muted)] mt-1">{template.name}</p>
      </div>
      <InspectionTemplateForm
        facilityId={facilityId}
        templateId={templateId}
        initial={{
          name: template.name,
          assetClass: template.assetClass,
          inspectionType: template.inspectionType,
          facilitySpecific: !!template.facilityId,
          standardBasisRef: template.standardBasisRef ?? undefined,
          procedureText: template.procedureText ?? undefined,
          expectedFrequencyDays: template.expectedFrequencyDays ?? undefined,
          performerQualificationBasis: template.performerQualificationBasis ?? undefined,
          items: items.map((i) => ({
            prompt: i.prompt,
            responseType: i.responseType,
            required: i.required,
            acceptableRange: i.acceptableRange ?? undefined,
            failureSeverity: i.failureSeverity ?? undefined,
            regulatoryRequirementId: i.regulatoryRequirementId ?? undefined,
            autoCreateCorrectiveAction: i.autoCreateCorrectiveAction,
          })),
        }}
      />
    </div>
  );
}
