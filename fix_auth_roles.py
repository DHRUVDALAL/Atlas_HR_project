import re

with open("frontend-new/src/lib/auth.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Update type definitions in restoreSession
content = content.replace(
    "role: string;",
    "role: string;\n              secondary_role?: string;"
)

# Replace roles initialization in restoreSession
content = content.replace(
    "roles: [res.user.role as Role],",
    "roles: [res.user.role, res.user.secondary_role].filter(Boolean) as Role[],"
)

# Replace roles initialization in login
content = content.replace(
    "roles: [meRes.user.role as Role],",
    "roles: [meRes.user.role, meRes.user.secondary_role].filter(Boolean) as Role[],"
)

with open("frontend-new/src/lib/auth.tsx", "w", encoding="utf-8") as f:
    f.write(content)
