import re

with open("backend/middleware/role_auth.py", "r", encoding="utf-8") as f:
    content = f.read()

old_get_perms = '''def get_user_permissions(user: User) -> set:
    \"\"\"Return the set of permission codes granted to a user via its role.\"\"\"
    if not user.role:
        return set()
    return {p.code for p in user.role.permissions}'''

new_get_perms = '''def get_user_permissions(user: User) -> set:
    \"\"\"Return the set of permission codes granted to a user via its roles.\"\"\"
    perms = set()
    if user.role:
        perms.update(p.code for p in user.role.permissions)
    if user.secondary_role:
        perms.update(p.code for p in user.secondary_role.permissions)
    return perms'''

content = content.replace(old_get_perms, new_get_perms)

with open("backend/middleware/role_auth.py", "w", encoding="utf-8") as f:
    f.write(content)
