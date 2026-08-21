# Migration Document 08: Database Mapping

## 1. Candidate Table (`candidates`)
Stores the master candidate data. Fields mapped:
*   `first_name`, `last_name`, `email`, `phone`, `gender`, `date_of_birth`, `current_address`, `city`, `state`, `country`, `pincode`, `status`, `position_applied_for`.

## 2. Professional Details Table (`applicant_professional_details`)
Stores CTC and notice period details. Fields mapped:
*   `total_experience`, `relevant_experience`, `current_company`, `current_designation`, `current_ctc`, `expected_ctc`, `notice_period`, `preferred_location`.

## 3. History & Qualifications Tables
*   `applicant_employment_history`: Maps historical designations, company names, start/end dates, and job responsibilities.
*   `applicant_education`: Maps qualification levels, institutions, specialization, year of passing, and scores.
*   `interview_rounds`: Maps multi-stage review scorecards and decision flags.
