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

const SYSTEM = `You are ContainPoint Compliance Assistant, helping users understand SPCC-related obligations and how they appear in their ContainPoint workspace.

Rules:
- Use the searchComplianceKnowledge tool for general regulatory or product-help questions (40 CFR 112 concepts, inspections, containment, training, what ContainPoint features do).
- Use the getFacilitySnapshot tool whenever the user asks about THIS facility's data (what's due, counts, plan version, open actions, schedule, recent training/incidents).
- If tools return empty or errors, say so clearly. Never invent facility-specific numbers or dates.
- Cite retrieved document titles when you lean on RAG results.
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
    },
  });

  return result.toUIMessageStreamResponse();
}
