-- Insert default roles into the roles table
-- Note: You may need to enable the uuid-ossp extension for uuid_generate_v4()
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

INSERT INTO roles (role_id, role_name) VALUES
(uuid_generate_v4(), 'SYSTEM_ADMIN'),
(uuid_generate_v4(), 'HR_ADMIN'),
(uuid_generate_v4(), 'RECEPTIONIST'),
(uuid_generate_v4(), 'HR_PANEL'),
(uuid_generate_v4(), 'L1_PANEL'),
(uuid_generate_v4(), 'L2_PANEL'),
(uuid_generate_v4(), 'TECH_HEAD')
ON CONFLICT (role_name) DO NOTHING;