import { NextResponse } from "next/server";
import {
  streamText,
  tool,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { getChatModelId, getOpenAIProvider } from "@/lib/openai-provider";
import { formatRagContext, searchComplianceKnowledge } from "@/lib/compliance-rag";
import { buildFacilitySnapshotJson } from "@/lib/assistant-facility-snapshot";
import { COMPLIANCE_DIAGRAM_IDS } from "@/lib/assistant-diagram-spec";

export const maxDuration = 60;
export const runtime = "nodejs";

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

const DIAGRAM_HINT = COMPLIANCE_DIAGRAM_IDS.join(", ");

const SYSTEM = `You are ContainPoint Compliance Assistant, helping users understand SPCC-related obligations (40 CFR 112) and how they appear in their ContainPoint workspace.

Rules:
- Use searchComplianceKnowledge for regulatory/product questions. The index includes markdown guides plus the organization's master Word specifications where ingested—cite source titles when you rely on them.
- Use getFacilitySnapshot whenever the user asks about THIS facility's data (what's due, counts, plan version, open actions, schedule, recent training/incidents).
- Use renderComplianceDiagram when a short visual will clarify a concept (applicability flow, containment, inspection loop, tier qualification, plan amendments). Call it at most once per answer unless the user explicitly asks for multiple diagrams. Valid diagramId values: ${DIAGRAM_HINT}. Optionally pass a one-line caption tying the diagram to the user's question. The client shows your written answer first, then the embedded diagram—refer to it as "below" or "following," not as a linked image. Never use Markdown image syntax (![]()).
- If tools return empty or errors, say so clearly. Never invent facility-specific numbers or dates.
- Answer in clear Markdown (headings, bullets, bold labels). The UI renders Markdown—do not wrap the whole answer in a single code fence.
- Always remind the user that you are not a lawyer or PE and they must confirm requirements against their approved SPCC Plan and applicable regulations.`;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ facilityId: string }> }
) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Assistant is not configured (missing OPENAI_API_KEY)." },
      { status: 503 }
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIdentifier(req);
  const rl = checkRateLimit(`assistant:${session.user.id}:${ip}`, 24);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const { facilityId } = await params;
  const facility = await checkAccess(facilityId, session.user.id);
  if (!facility) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { messages?: UIMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = body.messages;
  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "messages array required" }, { status: 400 });
  }

  let modelMessages;
  try {
    modelMessages = await convertToModelMessages(messages);
  } catch {
    return NextResponse.json({ error: "Invalid message format" }, { status: 400 });
  }

  const openai = getOpenAIProvider();
  const modelId = getChatModelId();

  const result = streamText({
    model: openai(modelId),
    system: `${SYSTEM}\n\nActive facility: "${facility.name}" (id: ${facilityId}).`,
    messages: modelMessages,
    stopWhen: stepCountIs(10),
    tools: {
      searchComplianceKnowledge: tool({
        description:
          "Search indexed compliance and product documentation (SPCC concepts, inspections, containment, ContainPoint features). Use for general 'what is required' questions.",
        inputSchema: z.object({
          query: z
            .string()
            .describe("Concise search query, e.g. 'monthly tank inspection records'"),
        }),
        execute: async ({ query }) => {
          const hits = await searchComplianceKnowledge(query, 8);
          return {
            context: formatRagContext(hits),
            sources: hits.map((h) => ({
              title: h.title,
              file: h.source,
              relevance: Number(h.score.toFixed(4)),
            })),
          };
        },
      }),
      getFacilitySnapshot: tool({
        description:
          "Load current facility data from ContainPoint: applicability, qualification, plan version, asset/containment counts, scheduled inspections, open corrective actions, recent training and incidents. Use for 'my facility' questions.",
        inputSchema: z.object({
          detail: z
            .enum(["summary", "full"])
            .optional()
            .describe("Use 'summary' for quick counts; 'full' includes lists (default full)."),
        }),
        execute: async ({ detail }) => {
          const snap = await buildFacilitySnapshotJson(facilityId);
          if ("error" in snap) {
            return { error: snap.error };
          }
          if (detail === "summary") {
            return {
              facilityName: snap.facilityName,
              counts: snap.counts,
              applicability: snap.applicability,
              qualification: snap.qualification,
              plan: snap.plan,
              scheduledInspectionCount: snap.scheduledInspections.length,
              openCorrectiveActionCount: snap.openCorrectiveActions.length,
            };
          }
          return snap;
        },
      }),
      renderComplianceDiagram: tool({
        description:
          "Embed a predefined interactive-style diagram in the chat (client-rendered). Use for applicability, containment, inspections, qualification tiers, or plan amendment flows.",
        inputSchema: z.object({
          diagramId: z.enum(COMPLIANCE_DIAGRAM_IDS),
          caption: z
            .string()
            .optional()
            .describe("Short caption linking the diagram to the user's question."),
        }),
        execute: async ({ diagramId, caption }) => ({ diagramId, caption }),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
