import re

with open("backend/schemas/auth.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "role: str\n    message: str",
    "role: str\n    secondary_role: Optional[str] = None\n    message: str"
)

with open("backend/schemas/auth.py", "w", encoding="utf-8") as f:
    f.write(content)
