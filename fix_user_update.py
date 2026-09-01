import re

with open("backend/schemas/user.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "role_id: Optional[uuid.UUID] = None",
    "role_id: Optional[uuid.UUID] = None\n    secondary_role_id: Optional[uuid.UUID] = None"
)

with open("backend/schemas/user.py", "w", encoding="utf-8") as f:
    f.write(content)
