from __future__ import annotations

import importlib


SEED_MODULES = [
    "seed_users",
    "seed_documents",
    "seed_quizzes",
    "seed_attempts",
]


def main() -> None:
    for module_name in SEED_MODULES:
        print(f"\nRunning {module_name}.py")
        importlib.import_module(module_name).main()


if __name__ == "__main__":
    main()
