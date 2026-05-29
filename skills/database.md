---
name: database
description: Model data and write safe SQL — schema, migrations, indexes, parameterized queries.
---

When working with a database / SQL:

1. **Schema**: explicit types, primary keys, foreign keys, NOT NULL where it matters, sensible defaults, UNIQUE on natural keys.
2. **Migrations**: make schema changes via migration files (forward + ideally reversible). Never hand-edit a live DB without a script.
3. **Parameterized queries ALWAYS** — never string-concat user input (SQL injection). Use placeholders/bindings.
4. **Indexes**: add them for columns used in WHERE / JOIN / ORDER BY on big tables; don't over-index small ones.
5. **Transactions** for multi-statement writes that must be atomic (e.g. order + stock decrement).
6. **Seed** realistic sample data in a separate script; keep test data isolated from real/demo data.
7. **Verify**: run the migration + a few queries, confirm constraints actually reject bad data.
