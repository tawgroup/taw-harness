# AGENTS.md — taw-harness

Repo này là một coding-agent harness viết tay (zero-dep), chạy bằng OpenCode Go.

## Nguyên tắc khi sửa repo
- **Không thêm dependency** trừ khi bắt buộc. Ưu tiên built-in Node.
- File `.mjs` ESM, chạy thẳng (không build step). Phải chạy được cả `node` và `bun`.
- Tool mới: thêm vào `src/tools.mjs` theo đúng shape `{schema, needsApproval, preview, run}`.
- Thao tác phá hoại (write/edit/bash) phải có `needsApproval: true`.
- Chuỗi hiển thị cho người dùng: tiếng Việt.

## Test
- `npm test` — offline checks luôn phải xanh.
- Có `OPENCODE_API_KEY` thì test live end-to-end.

## Endpoint (đã verify)
- Base: `https://opencode.ai/zen/go/v1` (KHÔNG phải `zen/v1` — cái đó trừ balance, báo CreditsError).
- Auth: header `authorization: Bearer <key gói Go>`.
- OpenAI-compatible `/chat/completions`, có thể trả thêm `reasoning_content` (bỏ qua được).

## Chọn model (verify 2026-05-29)
- Default `kimi-k2.5` (non-reasoning): in output thẳng, hợp gen code/UI.
- glm-5 / deepseek-v4-pro / minimax-m2.5: reasoning-heavy → đốt phần lớn token vào `reasoning_tokens`, dễ hết budget trước khi ra content. Dùng cho debug/suy luận, set `TAW_MAX_TOKENS` cao.
- Throughput biến động 17–47 tok/s; có request-timeout (`TAW_REQUEST_TIMEOUT`). Nhồi content >15k ký tự vào 1 tool-call `arguments` dễ bị "Provider returned error" → v2 nên ghi file lớn theo chunk.
