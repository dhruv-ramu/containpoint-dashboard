import { createOpenAI } from "@ai-sdk/openai";

export function getOpenAIProvider() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return createOpenAI({ apiKey });
}

export function getChatModelId() {
  return process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";
}
