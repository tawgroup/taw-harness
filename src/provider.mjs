// OpenCode Go client — OpenAI-compatible /chat/completions.
import { BASE_URL, API_KEY, MAX_TOKENS } from "./config.mjs";

const SLEEP = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Call the model once.
 * @returns {Promise<{message: object, finish_reason: string, usage: object}>}
 */
export async function chat({ messages, tools, model, maxTokens = MAX_TOKENS, signal }) {
  const body = {
    model,
    messages,
    max_tokens: maxTokens,
  };
  if (tools && tools.length) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    let res;
    try {
      res = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${API_KEY}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
        signal,
      });
    } catch (e) {
      lastErr = e;
      if (e.name === "AbortError") throw e;
      await SLEEP(500 * (attempt + 1));
      continue;
    }

    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      lastErr = new Error(`Bad response (${res.status}): ${text.slice(0, 300)}`);
      if (res.status >= 500) { await SLEEP(500 * (attempt + 1)); continue; }
      throw lastErr;
    }

    if (json.type === "error" || json.error) {
      const err = json.error || json;
      const type = err.type || "Error";
      const msg = err.message || JSON.stringify(err);
      // retryable
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`${type}: ${msg}`);
        await SLEEP(700 * (attempt + 1));
        continue;
      }
      throw new Error(`${type}: ${msg}`);
    }

    const choice = (json.choices || [])[0] || {};
    const message = choice.message || {};
    // normalize: kimi adds a stray top-level `name:null` on tool_calls; strip it
    if (Array.isArray(message.tool_calls)) {
      message.tool_calls = message.tool_calls.map((tc, i) => ({
        id: tc.id || `call_${i}`,
        type: "function",
        function: { name: tc.function?.name, arguments: tc.function?.arguments ?? "{}" },
      }));
    }
    return {
      message,
      finish_reason: choice.finish_reason,
      usage: json.usage || {},
      cost: json.cost,
    };
  }
  throw lastErr || new Error("request failed");
}
