# ATLAS Interview Management System - Backend

This is the backend for the Interview Management System (ATLAS) built with FastAPI, Python, PostgreSQL, and JWT authentication.

## Tech Stack
- **Language:** Python 3.8+
- **Framework:** FastAPI
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** Bcrypt
- **Authorization:** Role-Based Access Control (RBAC)

## Project Structure
```
backend/
├── app.py                  # Main FastAPI application
├── requirements.txt        # Python dependencies
├── database/
│   └── connection.py       # Database connection and session
├── models/
│   ├── user.py             # User model
│   └── role.py             # Role model
├── schemas/
│   ├── auth.py             # Authentication schemas (login, token)
│   └── user.py             # User schemas
├── routes/
│   ├── auth.py             # Authentication routes (login, me)
│   ├── protected.py        # Protected endpoint
│   └── admin.py            # Admin endpoint (SYSTEM_ADMIN only)
├── services/
│   └── auth_service.py     # Authentication business logic
├── middleware/
│   ├── auth.py             # JWT authentication dependency
│   └── role_auth.py        # Role-based access control decorator
├── utils/
│   ├── jwt_handler.py      # JWT encoding and decoding
│   └── password_handler.py # Password hashing and verification
└── sql/
    ├── insert_roles.sql    # SQL to insert default roles
    └── create_test_users.sql # SQL to create test users
```

## Setup Instructions

### 1. Clone the repository
```bash
git clone <repository_url>
cd Atlas/backend
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Set up environment variables
Create a `.env` file in the `backend` directory with the following variables:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 4. Set up the database
1. Ensure PostgreSQL is running and create a database (e.g., `atlas`).
2. Run the SQL scripts to insert default roles and create test users:
   ```bash
   psql -h localhost -U username -d atlas -f sql/insert_roles.sql
   psql -h localhost -U username -d atlas -f sql/create_test_users.sql
   ```
   *Note: You may need to adjust the connection parameters.*

### 5. Run the application
```bash
uvicorn app:app --reload
```
The server will start at `http://localhost:8000`.

### 6. Access the API documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email and password
- `GET /api/auth/me` - Get current logged-in user information

### Protected Endpoints
- `GET /api/protected` - Accessible with any valid JWT token
- `GET /api/admin` - Accessible only by users with `SYSTEM_ADMIN` role

## Testing
See [POSTMAN_TESTING_STEPS.md](POSTMAN_TESTING_STEPS.md) for detailed Postman testing steps.

## Environment Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/atlas` |
| `SECRET_KEY` | Secret key for JWT signing | `your_32_char_long_secret_key_here` |
| `ALGORITHM` | Algorithm for JWT encryption | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time in minutes | `30` |

## Default Roles
The following roles are inserted via `sql/insert_roles.sql`:
- SYSTEM_ADMIN
- HR_ADMIN
- RECEPTIONIST
- HR_PANEL
- L1_PANEL
- L2_PANEL
- TECH_HEAD

## Test Users
The following test users are created via `sql/create_test_users.sql` (password: `password123` for all):
- SYSTEM_ADMIN: admin@atlas.com
- HR_ADMIN: hr.admin@atlas.com
- RECEPTIONIST: reception@atlas.com

## Security Notes
- Passwords are hashed using bcrypt before storage.
- JWT tokens are signed with the SECRET_KEY and expire after the configured time.
- Role-based access control protects endpoints based on user roles.

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License
This project is licensed under the MIT License.