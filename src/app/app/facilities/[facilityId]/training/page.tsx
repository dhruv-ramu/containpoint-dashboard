import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";

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

export default async function TrainingPage({
  params,
}: {
  params: Promise<{ facilityId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { facilityId } = await params;
  const facility = await getFacility(facilityId, session.user.id);
  if (!facility) notFound();

  const events = await prisma.trainingEvent.findMany({
    where: { facilityId },
    include: { _count: { select: { attendance: true } } },
    orderBy: { eventDate: "desc" },
  });

  const personnel = await prisma.personnel.findMany({
    where: { facilityId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Training & annual briefing
        </h1>
        <p className="text-[var(--muted)] mt-1">
          Personnel, events, and attendance
        </p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <h2 className="font-medium mb-3">Personnel ({personnel.length})</h2>
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--mist-gray)]">
                  <th className="text-left font-medium px-4 py-3">Name</th>
                  <th className="text-left font-medium px-4 py-3">Role / title</th>
                  <th className="text-left font-medium px-4 py-3">Oil handling</th>
                </tr>
              </thead>
              <tbody>
                {personnel.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--border)]">
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3">{p.roleTitle ?? "—"}</td>
                    <td className="px-4 py-3">{p.oilHandlingPersonnel ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {personnel.length === 0 && (
              <div className="py-8 text-center text-[var(--muted)]">No personnel</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <h2 className="font-medium mb-3">Training events</h2>
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--mist-gray)]">
                  <th className="text-left font-medium px-4 py-3">Date</th>
                  <th className="text-left font-medium px-4 py-3">Type</th>
                  <th className="text-left font-medium px-4 py-3">Instructor</th>
                  <th className="text-left font-medium px-4 py-3">Attendees</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-b border-[var(--border)]">
                    <td className="px-4 py-3">{new Date(e.eventDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{e.type.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3">{e.instructorName ?? "—"}</td>
                    <td className="px-4 py-3">{e._count.attendance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {events.length === 0 && (
              <div className="py-8 text-center text-[var(--muted)]">No training events</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
