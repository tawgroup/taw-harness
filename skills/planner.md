---
name: planner
description: Design a task + a strong verification gate for a cheaper worker AI to execute. Use when you are the "planner" tier — you do NOT do the work, you produce the spec and the gate that proves the work is correct.
---

# Planner playbook (the "expensive brain" tier)

You are designing work for a CHEAPER worker model to execute in a loop. Your output is a **task spec** + a **verify gate** — NOT the fix itself. The whole run's quality depends on the gate, so the gate is the real deliverable.

## Rule 0 — stay disciplined (this is a "tight prompt")
Cheap models drift: given a vague job they wander off (grep the whole repo, read dozens of files) and run out of steps without producing anything. When YOU act as planner, and when you write a task for the worker, be tight:
- State EXACTLY which files to output and nothing else.
- Explicitly FORBID what is not needed (e.g. "do NOT explore, do NOT grep, do NOT read source — just write the two files").
- Keep step budget small for pure authoring tasks.
- Produce the artifacts FIRST; explain after.

## What to produce
1. **task.txt** — a precise worker spec: the goal, the exact files it may edit, hard constraints (don't break syntax, keep data files valid, only touch allowed paths), and "smaller-correct beats larger-broken".
2. **gate.sh** — a bash script, `exit 0` = pass / non-zero = fail, that PROVES the change is safe.

## Designing the gate — assume the worker WILL break things subtly
A gate is only useful if it catches the failure modes the worker actually produces. Two ways a gate fails:
- **False-positive** (worst): gate says PASS but code is broken. A plain compile/typecheck is NOT enough — it misses *type-valid garbage* (e.g. a bad string-replace leaves a stray line `cel` after turning `Cancel` into `{t('common.cancel')}` — compiles fine, renders garbage).
- **False-negative**: gate says FAIL but code is fine — worker then "fixes" something that wasn't broken. Make checks precise, not trigger-happy.

Before finalizing, ask: **"if the worker did the dumbest plausible wrong thing, would my gate catch it?"** If not, add a check.

### Checklist of gate layers (include the ones relevant to the task)
1. **Compile / typecheck** — must stay at baseline (e.g. `tsc --noEmit` = 0 errors). Necessary, never sufficient.
2. **Data files valid** — parse every JSON/YAML the worker may touch (`JSON.parse`/`python3 -c 'json.load'`).
3. **Garbage-text / orphan-fragment scan** — catch leftover fragments from bad edits: e.g. lines in source that are nothing but a short bare word, or alphabetic junk glued after a closing tag (`</button>cel`). This is the check a naive gate misses.
4. **Cross-file consistency** — e.g. two locale files must have identical key sets; a referenced key must exist in the data file.
5. **Completeness** — the thing that was supposed to be removed/replaced is actually gone (grep for the old pattern → must be empty).
6. **Scope guard** — only the allowed paths changed (`git diff --name-only` ⊆ allowed set), nothing outside touched.
7. **Smoke run** (if it's an app) — boot it and hit one real endpoint, don't just compile.

Print a clear PASS/FAIL summary at the end and exit non-zero if any layer failed.

## Hand-off
Give the worker the task + tell it the gate will run automatically and it must keep iterating until the gate passes. Never let the worker edit or weaken the gate.
