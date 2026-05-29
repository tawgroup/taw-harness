---
name: python
description: Write idiomatic, runnable Python — venv, type hints, stdlib-first, run it to prove it works.
---

When writing Python:

1. **Version + venv**: check `python3 --version`. If installing deps, use a venv: `python3 -m venv .venv && . .venv/bin/activate && pip install ...`. Pin them in `requirements.txt`.
2. **Stdlib first**: prefer the standard library before adding a dependency.
3. **Style**: PEP 8, clear names, type hints on function signatures, docstrings for non-obvious functions. Guard scripts with `if __name__ == "__main__":`.
4. **Errors**: raise/catch specific exceptions, never bare `except:`. Validate inputs.
5. **Tests**: pytest (or `unittest`) for logic; run with `bash`.
6. **Verify**: actually run it (`python3 file.py` / `pytest`) and paste the output.
