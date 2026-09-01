import sys
sys.path.insert(0, '.')
from database.connection import SessionLocal
from models.user import User
from models.role import Role
from utils.password_handler import get_password_hash

db = SessionLocal()

roles = ['SYSTEM_ADMIN', 'RECEPTIONIST', 'HR_ADMIN', 'L1_PANEL']
roles_map = {}
for r in roles:
    role = db.query(Role).filter_by(role_name=r).first()
    if not role:
        role = Role(role_name=r)
        db.add(role)
        db.commit()
    roles_map[r] = role.role_id

users_to_seed = [
    {'email': 'umesh@abhiyantatech.com', 'employee_code': 'ADMIN001', 'first_name': 'Umesh', 'last_name': 'Admin', 'role_name': 'SYSTEM_ADMIN'},
    {'email': 'amsadmin@abhiyantatech.com', 'employee_code': 'RECP001', 'first_name': 'Reception', 'last_name': 'Admin', 'role_name': 'RECEPTIONIST'},
    {'email': 'Faisal.k@abhiyantatech.com', 'employee_code': 'HR001', 'first_name': 'Faisal', 'last_name': 'HR', 'role_name': 'HR_ADMIN'},
    {'email': 'Akanksha.K@abhiyantatech.com', 'employee_code': 'HR002', 'first_name': 'Akanksha', 'last_name': 'HR', 'role_name': 'HR_ADMIN'},
    {'email': 'Akshata.K@abhiyantatech.com', 'employee_code': 'HR003', 'first_name': 'Akshata', 'last_name': 'HR', 'role_name': 'HR_ADMIN'},
    {'email': 'Sayali.S@abhiyantatech.com', 'employee_code': 'HR004', 'first_name': 'Sayali', 'last_name': 'HR', 'role_name': 'HR_ADMIN'},
    {'email': 'Saraswathi.P@abhiyantatech.com', 'employee_code': 'HR005', 'first_name': 'Saraswathi', 'last_name': 'HR', 'role_name': 'HR_ADMIN'},
    {'email': 'Amol.S@abhiyantatech.com', 'employee_code': 'L1_001', 'first_name': 'Amol', 'last_name': 'Somwanshi', 'role_name': 'L1_PANEL'},
    {'email': 'Krunal.K@abhiyantatech.com', 'employee_code': 'L1_002', 'first_name': 'Krunal', 'last_name': 'Khode', 'role_name': 'L1_PANEL'},
    {'email': 'Accounts@abhiyantatech.com', 'employee_code': 'L1_003', 'first_name': 'Neil', 'last_name': 'Joglekar', 'role_name': 'L1_PANEL'},
    {'email': 'Vinod.H@abhiyantatech.com', 'employee_code': 'L1_004', 'first_name': 'Vinod', 'last_name': 'Harkare', 'role_name': 'L1_PANEL'},
    {'email': 'Viraj.M@abhiyantatech.com', 'employee_code': 'L1_005', 'first_name': 'Viraj', 'last_name': 'Mahanawar', 'role_name': 'L1_PANEL'},
    {'email': 'Amol.p@abhiyantatech.com', 'employee_code': 'L1_006', 'first_name': 'Amol', 'last_name': 'Pawar', 'role_name': 'L1_PANEL'},
    {'email': 'Pooja.v@abhiyantatech.com', 'employee_code': 'L1_007', 'first_name': 'Pooja', 'last_name': 'V', 'role_name': 'L1_PANEL'},
    {'email': 'karan.k@abhiyantatech.com', 'employee_code': 'L1_008', 'first_name': 'Karan', 'last_name': 'K', 'role_name': 'L1_PANEL'},
    {'email': 'Trupti.W@abhiyantatech.com', 'employee_code': 'L1_009', 'first_name': 'Trupti', 'last_name': 'W', 'role_name': 'L1_PANEL'},
    {'email': 'Varsha@abhiyantatech.com', 'employee_code': 'L1_010', 'first_name': 'Varsha', 'last_name': 'V', 'role_name': 'L1_PANEL'},
    {'email': 'Parth.c@abhiyantatech.com', 'employee_code': 'L1_011', 'first_name': 'Parth', 'last_name': 'C', 'role_name': 'L1_PANEL'},
    {'email': 'Ashwini.G@abhiyantatech.com', 'employee_code': 'L1_012', 'first_name': 'Ashwini', 'last_name': 'G', 'role_name': 'L1_PANEL'},
    {'email': 'Nitesh.T@abhiyantatech.com', 'employee_code': 'L1_013', 'first_name': 'Nitesh', 'last_name': 'T', 'role_name': 'L1_PANEL'},
    {'email': 'Anand@abhiyantatech.com', 'employee_code': 'L1_014', 'first_name': 'Anand', 'last_name': 'A', 'role_name': 'L1_PANEL'},
    {'email': 'Abhishek.T@abhiyantatech.com', 'employee_code': 'L1_015', 'first_name': 'Abhishek', 'last_name': 'T', 'role_name': 'L1_PANEL'},
    {'email': 'Swapnil.M@abhiyantatech.com', 'employee_code': 'L1_016', 'first_name': 'Swapnil', 'last_name': 'M', 'role_name': 'L1_PANEL'},
    {'email': 'Kishor.J@abhiyantatech.com', 'employee_code': 'L1_017', 'first_name': 'Kishor', 'last_name': 'J', 'role_name': 'L1_PANEL'},
    {'email': 'baliram@abhiyantatech.com', 'employee_code': 'L1_018', 'first_name': 'Baliram', 'last_name': 'B', 'role_name': 'L1_PANEL'},
    {'email': 'sanket@abhiyantatech.com', 'employee_code': 'L1_019', 'first_name': 'Sanket', 'last_name': 'S', 'role_name': 'L1_PANEL'},
    {'email': 'Shrikant.T@abhiyantatech.com', 'employee_code': 'L1_020', 'first_name': 'Shrikant', 'last_name': 'T', 'role_name': 'L1_PANEL'},
    {'email': 'Shailesh.P@abhiyantatech.com', 'employee_code': 'L1_021', 'first_name': 'Shailesh', 'last_name': 'P', 'role_name': 'L1_PANEL'},
    {'email': 'Balaram.p@abhiyantatech.com', 'employee_code': 'L1_022', 'first_name': 'Balaram', 'last_name': 'P', 'role_name': 'L1_PANEL'},
    {'email': 'Abhinandan.d@abhiyantatech.com', 'employee_code': 'L1_023', 'first_name': 'Abhinandan', 'last_name': 'D', 'role_name': 'L1_PANEL'},
    {'email': 'Rahul.S@abhiyantatech.com', 'employee_code': 'L1_024', 'first_name': 'Rahul', 'last_name': 'S', 'role_name': 'L1_PANEL'},
    {'email': 'Manisha.S@abhiyantatech.com', 'employee_code': 'L1_025', 'first_name': 'Manisha', 'last_name': 'S', 'role_name': 'L1_PANEL'}
]

common_hash = get_password_hash('password123')
for u_data in users_to_seed:
    user = db.query(User).filter_by(employee_code=u_data['employee_code']).first()
    if not user:
        user = User(
            email=u_data['email'],
            first_name=u_data['first_name'],
            last_name=u_data['last_name'],
            employee_code=u_data['employee_code'],
            password=common_hash,
            role_id=roles_map[u_data['role_name']],
            is_active=True
        )
        db.add(user)
    else:
        user.password = common_hash
        user.role_id = roles_map[u_data['role_name']]
    
db.commit()
print('SUCCESS! ALL USERS CREATED.')
