import re

with open("backend/schemas/auth.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "role: str\n    message: Optional[str] = None",
    "role: str\n    secondary_role: Optional[str] = None\n    message: Optional[str] = None"
)
content = content.replace(
    "role: str\n    is_active: bool",
    "role: str\n    secondary_role: Optional[str] = None\n    is_active: bool"
)

with open("backend/schemas/auth.py", "w", encoding="utf-8") as f:
    f.write(content)
