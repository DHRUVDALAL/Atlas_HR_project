import re

with open("frontend-new/src/routes/_authenticated.users.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# For edit
content = content.replace(
    "const payload = { ...formData };",
    "const payload: any = { ...formData };\n        if (payload.secondary_role_id === 'none') payload.secondary_role_id = null;"
)

# For create
content = content.replace(
    "body: formData,",
    "body: { ...formData, secondary_role_id: formData.secondary_role_id === 'none' ? null : formData.secondary_role_id },"
)

with open("frontend-new/src/routes/_authenticated.users.tsx", "w", encoding="utf-8") as f:
    f.write(content)
