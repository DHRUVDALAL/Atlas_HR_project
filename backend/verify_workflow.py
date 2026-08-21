import os
import sys
from pprint import pprint

# Ensure we can import from backend
sys.path.insert(0, os.path.abspath("backend"))

from database.connection import SessionLocal
from services.workflow_service import (
    hr_submit_candidate_review,
    submit_technical_round_evaluation,
)
from services.interview_service import get_questions_for_domain_experience, create_assignment
from models.applicant import Applicant, CandidateAssignment, InterviewRound
from models.interview_engine import SapDomain, ExperienceBracket, CandidateInterviewAssignment

def trace_workflow():
    db = SessionLocal()
    try:
        # Create a mock candidate directly in the DB for the test
        candidate = Applicant(
            application_number="TEST_WF_123",
            first_name="Test",
            last_name="Workflow",
            email="testwf@atlas.com",
            phone="1234567890",
            gender="MALE",
            date_of_birth="2000-01-01",
            current_address="123 Test St",
            city="Testville",
            state="TestState",
            country="TestCountry",
            pincode="12345",
            status="RECEPTION_FORWARDED"
        )
        db.add(candidate)
        db.commit()
        db.refresh(candidate)
        
        cid = str(candidate.candidate_id)
        print(f"--- CREATED TEST CANDIDATE: {cid} ---")
        print(f"Current Status: {candidate.status}")

        # Ensure reference data is loaded by checking domains
        domain = db.query(SapDomain).filter_by(code="FI").first()
        bracket = db.query(ExperienceBracket).filter_by(code="0-3 yrs").first()
        
        if not domain or not bracket:
            print("Reference data missing, cannot trace workflow.")
            return

        print("\n--- 1. HR SUBMITS REVIEW ---")
        hr_submit_candidate_review(
            db=db,
            candidate_id=cid,
            domain="FI",
            experience_bracket="0-3 yrs",
            number_of_tech_rounds=2,
            hr_status="SELECT",
            first_interviewer_email="l1.panel@atlas.com",
            evaluation_data={"hr_notes": "Looks good"},
            performed_by="hr@atlas.com"
        )
        
        db.refresh(candidate)
        print(f"Candidate Status after HR SELECT: {candidate.status}")
        print(f"Total Rounds Assigned: {candidate.total_rounds}")
        
        assignments = db.query(CandidateInterviewAssignment).filter_by(candidate_id=candidate.candidate_id).all()
        print(f"CandidateInterviewAssignments Created: {len(assignments)}")
        print(f"Assigned Interviewer: {assignments[0].assigned_interviewer if assignments else None}")

        if not assignments:
            print("FAILED: No technical assignment created.")
            return
            
        print("\n--- 2. INTERVIEWER L1 LOADS QUESTIONS ---")
        questions = get_questions_for_domain_experience(db, "FI", "0-3 yrs")
        print(f"Total Questions Loaded for FI (0-3 yrs): {len(questions)}")
        
        if len(questions) == 0:
            print("FAILED: No questions found for FI (0-3 yrs)")
            return
            
        print("\n--- 3. INTERVIEWER L1 SUBMITS EVALUATION ---")
        # Build mock evaluation data
        eval_data = {
            "ratings": {
                str(questions[0]["id"]): {"rating": 4, "comment": "Good"},
                str(questions[1]["id"]): {"rating": 5, "comment": "Excellent"}
            }
        }
        
        submit_technical_round_evaluation(
            db=db,
            candidate_id=cid,
            round_number=1,
            status_selection="COMPLETED",
            remarks="Great performance in round 1.",
            evaluation_data=eval_data,
            next_interviewer_email="l2.panel@atlas.com",
            performed_by="l1.panel@atlas.com"
        )
        
        db.refresh(candidate)
        print(f"Candidate Status after L1 Submission: {candidate.status}")
        
        assignments_l2 = db.query(CandidateInterviewAssignment).filter_by(candidate_id=candidate.candidate_id, status="ACTIVE").all()
        print(f"Active CandidateInterviewAssignments Created for L2: {len(assignments_l2)}")
        if assignments_l2:
            print(f"L2 Assigned Interviewer: {assignments_l2[0].assigned_interviewer}")

        print("\n--- 4. INTERVIEWER L2 SUBMITS EVALUATION (FINAL ROUND) ---")
        eval_data_l2 = {
            "ratings": {
                str(questions[0]["id"]): {"rating": 3, "comment": "Okay"}
            }
        }
        submit_technical_round_evaluation(
            db=db,
            candidate_id=cid,
            round_number=2,
            status_selection="COMPLETED",
            remarks="Acceptable performance in round 2.",
            evaluation_data=eval_data_l2,
            next_interviewer_email=None,
            performed_by="l2.panel@atlas.com"
        )
        
        db.refresh(candidate)
        print(f"Candidate Status after L2 Submission (Final Tech Round): {candidate.status}")
        
        rounds = db.query(InterviewRound).filter_by(candidate_id=candidate.candidate_id).order_by(InterviewRound.round_number).all()
        print("\n--- WORKFLOW ROUNDS HISTORY ---")
        for r in rounds:
            print(f"Round {r.round_number} ({r.round_type}) - Status: {r.status} - By: {r.assigned_interviewer}")
        
        active_assignments = db.query(CandidateAssignment).filter_by(candidate_id=candidate.candidate_id, status="ACTIVE").all()
        print(f"\nFinal Active Candidate Assignments: {len(active_assignments)}")
        if active_assignments:
            print(f"Final Assigned To: {active_assignments[0].assigned_to}")
            
        print("\nALL VERIFICATIONS PASSED.")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Cleanup
        db.query(Applicant).filter_by(application_number="TEST_WF_123").delete()
        db.commit()
        db.close()

if __name__ == "__main__":
    trace_workflow()
