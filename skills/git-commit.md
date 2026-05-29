---
name: git-commit
description: Tạo commit chuẩn (conventional commit) sau khi đọc diff thật, có quét lộ secret.
---

Khi người dùng muốn commit:

1. Chạy `git status` và `git diff --staged` (nếu chưa stage thì `git diff`) để ĐỌC thay đổi thật. Không đoán.
2. Quét nhanh secret bị lộ trong diff: chuỗi dạng `sk-`, `AKIA`, `-----BEGIN`, `password=`, token dài. Nếu thấy → dừng, cảnh báo người dùng, KHÔNG commit.
3. `git add` các file liên quan (bỏ qua node_modules, .env, build artifacts).
4. Sinh message dạng: `type(scope): mô tả ngắn` — type ∈ feat|fix|docs|refactor|test|chore. Mô tả bằng tiếng Việt, ≤72 ký tự dòng đầu.
5. `git commit -m "..."`. Báo lại hash + message.
