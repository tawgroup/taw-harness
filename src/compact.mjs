// Context compaction: when the conversation grows too large, summarize older turns
// so a long task doesn't overflow the cheap model's context window.
import { chat } from "./provider.mjs";
import { COMPACT_THRESHOLD } from "./config.mjs";

// Rough token estimate (~4 chars/token) over the whole message array.
export function estimateTokens(messages) {
  let chars = 0;
  for (const m of messages) {
    if (typeof m.content === "string") chars += m.content.length;
    if (m.tool_calls) chars += JSON.stringify(m.tool_calls).length;
  }
  return Math.ceil(chars / 4);
}

// A tool result must immediately follow its assistant tool_call; never split that pair.
// We keep [0]=system, summarize the middle, and keep the last `keepRecent` messages —
// then nudge the cut forward so we never start the kept tail on an orphan "tool" message.
export async function maybeCompact(messages, { model, signal, onEvent = () => {}, keepRecent = 6 } = {}) {
  if (!COMPACT_THRESHOLD) return false;
  if (estimateTokens(messages) < COMPACT_THRESHOLD) return false;
  if (messages.length <= keepRecent + 3) return false; // too short to bother

  let cut = messages.length - keepRecent;
  while (cut < messages.length && messages[cut].role === "tool") cut++; // don't orphan a tool result
  const head = messages[0]; // system
  const middle = messages.slice(1, cut);
  const tail = messages.slice(cut);
  if (middle.length < 2) return false;

  // Render the middle as plain text for the summarizer.
  const transcript = middle
    .map((m) => {
      if (m.role === "assistant" && m.tool_calls)
        return `ASSISTANT called: ${m.tool_calls.map((c) => `${c.function?.name}(${c.function?.arguments || ""})`).join("; ")}` + (m.content ? `\n${m.content}` : "");
      if (m.role === "tool") return `TOOL RESULT: ${String(m.content).slice(0, 1500)}`;
      return `${m.role.toUpperCase()}: ${m.content}`;
    })
    .join("\n\n")
    .slice(0, 48000);

  onEvent({ type: "compact_start", before: estimateTokens(messages) });
  let summary;
  try {
    const r = await chat({
      model,
      signal,
      maxTokens: 1500,
      messages: [
        { role: "system", content: "You compress an AI coding agent's working log. Produce a dense, factual summary that lets the agent continue without re-reading the original. Keep: the task/goal, concrete findings (file paths, line numbers, values), decisions made, what worked/failed, and what's left to do. Use terse bullet points. No preamble." },
        { role: "user", content: `Summarize this agent work log so I can continue the task:\n\n${transcript}` },
      ],
    });
    summary = r.message?.content?.trim();
  } catch (e) {
    onEvent({ type: "compact_error", error: e.message });
    return false;
  }
  if (!summary) return false;

  // Replace the middle with one synthetic user note carrying the summary.
  messages.splice(0, messages.length,
    head,
    { role: "user", content: `[Earlier work compacted to save context]\n\n${summary}` },
    ...tail,
  );
  onEvent({ type: "compact_done", after: estimateTokens(messages) });
  return true;
}
