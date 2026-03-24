import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

export default async function TemplateDetailPage({
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
        include: {
          items: {
            orderBy: { sequenceOrder: "asc" },
            include: { regulatoryRequirement: true },
          },
        },
      },
    },
  });

  if (!template) notFound();

  const version = template.versions[0];
  const items = version?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            {template.name}
          </h1>
          <p className="text-[var(--muted)] mt-1">
            {template.assetClass.replace(/_/g, " ")} · {template.inspectionType.replace(/_/g, " ")}
          </p>
        </div>
        <Button asChild>
          <Link href={`/app/facilities/${facilityId}/inspections/templates/${templateId}/edit`}>
            Edit template
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-5">
          <h2 className="font-medium mb-3">Metadata</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-[var(--muted)]">Asset class</dt>
              <dd>{template.assetClass.replace(/_/g, " ")}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Inspection type</dt>
              <dd>{template.inspectionType.replace(/_/g, " ")}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Scope</dt>
              <dd>{template.facilityId ? "Facility-specific" : "Org-wide"}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Expected frequency</dt>
              <dd>{template.expectedFrequencyDays ? `${template.expectedFrequencyDays} days` : "—"}</dd>
            </div>
            {template.standardBasisRef && (
              <div className="col-span-2">
                <dt className="text-[var(--muted)]">Standard basis</dt>
                <dd>{template.standardBasisRef}</dd>
              </div>
            )}
            {template.procedureText && (
              <div className="col-span-2">
                <dt className="text-[var(--muted)]">Procedure</dt>
                <dd className="whitespace-pre-wrap">{template.procedureText}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <h2 className="font-medium mb-3">Checklist items ({items.length})</h2>
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--mist-gray)]">
                  <th className="text-left font-medium px-4 py-3 w-10">#</th>
                  <th className="text-left font-medium px-4 py-3">Prompt</th>
                  <th className="text-left font-medium px-4 py-3 w-28">Type</th>
                  <th className="text-left font-medium px-4 py-3 w-20">Required</th>
                  <th className="text-left font-medium px-4 py-3 w-24">Fail severity</th>
                  <th className="text-left font-medium px-4 py-3">Requirement</th>
                  <th className="text-left font-medium px-4 py-3 w-20">Auto CA</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} className="border-b border-[var(--border)]">
                    <td className="px-4 py-3">{i + 1}</td>
                    <td className="px-4 py-3">{item.prompt}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {item.responseType.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3">{item.required ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">{item.failureSeverity ?? "—"}</td>
                    <td className="px-4 py-3">
                      {item.regulatoryRequirement
                        ? `${item.regulatoryRequirement.requirementCode} – ${item.regulatoryRequirement.title.slice(0, 40)}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">{item.autoCreateCorrectiveAction ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && (
              <div className="py-8 text-center text-[var(--muted)]">No items</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
