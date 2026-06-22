-- ============================================================================
-- ATLAS HR Project — Applicant Form Intake Module
-- Database Schema Creation Script
--
-- This script creates all tables for the Applicant Form module.
-- SQLAlchemy's Base.metadata.create_all() handles actual creation at startup,
-- but this file serves as a reference DDL and for manual migrations.
-- ============================================================================

-- Extension for UUID generation (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Section 1 — Applicants (Personal Details + Status)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applicants (
    applicant_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_number  VARCHAR(30) NOT NULL UNIQUE,
    first_name          VARCHAR(50) NOT NULL,
    middle_name         VARCHAR(50),
    last_name           VARCHAR(50) NOT NULL,
    email               VARCHAR(100) NOT NULL UNIQUE,
    phone               VARCHAR(15) NOT NULL,
    alternate_phone     VARCHAR(15),
    gender              VARCHAR(10) NOT NULL,
    date_of_birth       DATE NOT NULL,
    current_address     TEXT NOT NULL,
    permanent_address   TEXT,
    city                VARCHAR(50) NOT NULL,
    state               VARCHAR(50) NOT NULL,
    country             VARCHAR(50) NOT NULL,
    pincode             VARCHAR(10) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applicants_status ON applicants(status);
CREATE INDEX IF NOT EXISTS idx_applicants_email ON applicants(email);
CREATE INDEX IF NOT EXISTS idx_applicants_app_number ON applicants(application_number);

-- ---------------------------------------------------------------------------
-- Section 2 — Professional Details (one-to-one)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applicant_professional_details (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id            UUID NOT NULL UNIQUE REFERENCES applicants(applicant_id) ON DELETE CASCADE,
    current_company         VARCHAR(100),
    current_designation     VARCHAR(100),
    total_experience        FLOAT NOT NULL DEFAULT 0,
    relevant_experience     FLOAT NOT NULL DEFAULT 0,
    current_ctc             FLOAT,
    expected_ctc            FLOAT,
    notice_period           VARCHAR(50),
    joining_availability    VARCHAR(50),
    preferred_location      VARCHAR(100),
    employment_type         VARCHAR(20) NOT NULL DEFAULT 'FULL_TIME'
);

-- ---------------------------------------------------------------------------
-- Section 3 — Employment History (one-to-many)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applicant_employment_history (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id        UUID NOT NULL REFERENCES applicants(applicant_id) ON DELETE CASCADE,
    company_name        VARCHAR(100) NOT NULL,
    designation         VARCHAR(100) NOT NULL,
    start_date          DATE NOT NULL,
    end_date            DATE,
    responsibilities    TEXT,
    reason_for_leaving  TEXT
);

CREATE INDEX IF NOT EXISTS idx_emp_history_applicant ON applicant_employment_history(applicant_id);

-- ---------------------------------------------------------------------------
-- Section 4 — Educational Qualifications (one-to-many)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applicant_education (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id        UUID NOT NULL REFERENCES applicants(applicant_id) ON DELETE CASCADE,
    qualification       VARCHAR(100) NOT NULL,
    institution_name    VARCHAR(150) NOT NULL,
    university          VARCHAR(150),
    passing_year        INTEGER NOT NULL,
    percentage          FLOAT,
    grade               VARCHAR(10),
    specialization      VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_education_applicant ON applicant_education(applicant_id);

-- ---------------------------------------------------------------------------
-- Section 5 — Personality Assessment / Your Perspective (one-to-many)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applicant_personality_assessment (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id        UUID NOT NULL REFERENCES applicants(applicant_id) ON DELETE CASCADE,
    question_number     INTEGER NOT NULL,
    rating              INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    UNIQUE (applicant_id, question_number)
);

CREATE INDEX IF NOT EXISTS idx_personality_applicant ON applicant_personality_assessment(applicant_id);

-- ---------------------------------------------------------------------------
-- Section 6 — Situational / Workplace Scenarios (one-to-many)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applicant_situational_responses (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id        UUID NOT NULL REFERENCES applicants(applicant_id) ON DELETE CASCADE,
    question_number     INTEGER NOT NULL,
    selected_option     VARCHAR(1) NOT NULL CHECK (selected_option IN ('A','B','C','D')),
    UNIQUE (applicant_id, question_number)
);

CREATE INDEX IF NOT EXISTS idx_situational_applicant ON applicant_situational_responses(applicant_id);

-- ---------------------------------------------------------------------------
-- Section 7 — Written / Descriptive Responses (one-to-many)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applicant_written_responses (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id        UUID NOT NULL REFERENCES applicants(applicant_id) ON DELETE CASCADE,
    question_number     INTEGER NOT NULL,
    answer_text         TEXT NOT NULL,
    UNIQUE (applicant_id, question_number)
);

CREATE INDEX IF NOT EXISTS idx_written_applicant ON applicant_written_responses(applicant_id);

-- ---------------------------------------------------------------------------
-- Section 8 — Declaration & Consent (one-to-one)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applicant_declaration (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id            UUID NOT NULL UNIQUE REFERENCES applicants(applicant_id) ON DELETE CASCADE,
    declaration_accepted    BOOLEAN NOT NULL DEFAULT FALSE,
    consent_accepted        BOOLEAN NOT NULL DEFAULT FALSE,
    signed_date             DATE
);

-- ---------------------------------------------------------------------------
-- Signature / Document Upload
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applicant_documents (
    document_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id    UUID NOT NULL REFERENCES applicants(applicant_id) ON DELETE CASCADE,
    document_type   VARCHAR(30) NOT NULL DEFAULT 'SIGNATURE_PDF',
    file_name       VARCHAR(255) NOT NULL,
    file_path       VARCHAR(500) NOT NULL,
    uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_applicant ON applicant_documents(applicant_id);

-- ---------------------------------------------------------------------------
-- Section 9 — Interview Panel Assessment (INTERNAL USE ONLY)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS interview_panel_assessment (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id            UUID NOT NULL REFERENCES applicants(applicant_id) ON DELETE CASCADE,
    panel_member_name       VARCHAR(100),
    panel_role              VARCHAR(50),
    technical_rating        INTEGER,
    communication_rating    INTEGER,
    overall_rating          INTEGER,
    recommendation          VARCHAR(20),
    comments                TEXT,
    assessed_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_panel_applicant ON interview_panel_assessment(applicant_id);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
