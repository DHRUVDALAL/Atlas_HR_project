-- Create test users for each role
-- Note: Replace the password hash with a real bcrypt hash of the desired password.
-- To generate a real hash, use: 
--   from passlib.context import CryptContext
--   pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
--   pwd_context.hash('your_password')
-- 
-- The password for all test users is set to 'password123' (hash provided below is a dummy).
-- You should update the hash with a real one.

INSERT INTO users (user_id, role_id, employee_code, first_name, last_name, email, mobile_no, password, department, is_active) VALUES
-- SYSTEM_ADMIN
(uuid_generate_v4(), (SELECT role_id FROM roles WHERE role_name = 'SYSTEM_ADMIN'), 'ADMIN001', 'System', 'Admin', 'admin@atlas.com', '1234567890', '$2b$12$dummyhashfortestingpurposesonly', NULL, true),
-- HR_ADMIN
(uuid_generate_v4(), (SELECT role_id FROM roles WHERE role_name = 'HR_ADMIN'), 'HR001', 'HR', 'Admin', 'hr.admin@atlas.com', '1234567891', '$2b$12$dummyhashfortestingpurposesonly', NULL, true),
-- RECEPTIONIST
(uuid_generate_v4(), (SELECT role_id FROM roles WHERE role_name = 'RECEPTIONIST'), 'RECP001', 'Reception', 'User', 'reception@atlas.com', '1234567892', '$2b$12$dummyhashfortestingpurposesonly', NULL, true);