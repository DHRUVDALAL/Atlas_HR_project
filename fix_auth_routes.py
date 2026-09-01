import re

with open("backend/routes/auth.py", "r", encoding="utf-8") as f:
    content = f.read()

# Update login response to include secondary_role
content = content.replace(
    "role=role_name,",
    "role=role_name,\n        secondary_role=user.secondary_role.role_name if user.secondary_role else None,"
)

# Update /me response to include secondary_role
content = content.replace(
    "role=current_user.role.role_name,",
    "role=current_user.role.role_name,\n        secondary_role=current_user.secondary_role.role_name if current_user.secondary_role else None,"
)

with open("backend/routes/auth.py", "w", encoding="utf-8") as f:
    f.write(content)
