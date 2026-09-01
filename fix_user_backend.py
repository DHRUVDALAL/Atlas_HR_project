import re

with open("backend/routes/user.py", "r", encoding="utf-8") as f:
    content = f.read()

# Fix CREATE
content = content.replace(
    "role_id=payload.role_id,",
    "role_id=payload.role_id,\n        secondary_role_id=payload.secondary_role_id,"
)

# Fix UPDATE
update_logic = '''    if payload.role_id is not None:
        role = db.query(Role).filter(Role.role_id == payload.role_id).first()
        if not role:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
        user.role_id = payload.role_id
'''
new_update_logic = update_logic + '''        
    if hasattr(payload, 'secondary_role_id') and payload.secondary_role_id is not None:
        sec_role = db.query(Role).filter(Role.role_id == payload.secondary_role_id).first()
        if not sec_role:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Secondary role not found")
        user.secondary_role_id = payload.secondary_role_id
    elif hasattr(payload, 'secondary_role_id') and payload.secondary_role_id is None:
        # Check if it was explicitly set to None (meaning remove secondary role)
        # In Pydantic v2, we can check model_fields_set to know if it was explicitly sent as None
        if 'secondary_role_id' in payload.model_fields_set:
            user.secondary_role_id = None
'''
content = content.replace(update_logic, new_update_logic)

with open("backend/routes/user.py", "w", encoding="utf-8") as f:
    f.write(content)
