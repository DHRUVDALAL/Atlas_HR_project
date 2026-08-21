from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from models.email import EmailTemplate


DEFAULT_TEMPLATES = [
    {
        "code": "candidate_registered",
        "name": "Candidate Registration Confirmation",
        "subject": "Application Received: {{position}} at Abhiyanta India Solutions",
        "body_html": """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
            <p>Dear {{candidate_name}},</p>
            
            <p>Thank you for your interest in joining Abhiyanta India Solutions.</p>
            
            <p>We have successfully received your application for the <strong>{{position}}</strong> position, and we appreciate the time you took to share your background, experience, and perspective with us.</p>
            
            <p>Your application reference number is: <strong>{{application_number}}</strong><br>
            <em>(Please keep this reference number handy, as you may need it for future communications or on your interview day.)</em></p>
            
            <p><strong>What happens next?</strong><br>
            Our recruiting team will carefully review your profile to evaluate how your skills and experiences align with the requirements of the role. Given the high volume of applications we receive, this process may take up to 2-3 business days.</p>
            
            <p>If your profile is a strong match, a member of our team will reach out to you directly to discuss the next steps in our interview process. Regardless of the outcome, we are committed to keeping you updated on the status of your application.</p>
            
            <p>In the meantime, we encourage you to learn more about our culture, our values, and the work we do by visiting our <a href="#">Abhiyanta India Solutions website</a>.</p>
            
            <p>Thank you again for considering Abhiyanta India Solutions as the next step in your career journey. We wish you the best of luck.</p>
            
            <p>Warm regards,<br>
            <strong>Human Resources Team</strong><br>
            Abhiyanta India Solutions</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666; font-style: italic;">
                Please do not reply directly to this email, as this inbox is not monitored. If you have any urgent questions or require accommodations during the hiring process, please reach out to <a href="mailto:recruiter@abhiyantatech.com">recruiter@abhiyantatech.com</a>
            </p>
        </div>
        """,
        "body_text": "Dear {{candidate_name}},\\n\\nThank you for your interest in joining Abhiyanta India Solutions. We have successfully received your application for the {{position}} position. Your application reference number is: {{application_number}}.\\n\\nPlease do not reply directly to this email, as this inbox is not monitored. If you have any urgent questions, please reach out to recruiter@abhiyantatech.com",
        "category": "candidate",
        "variables": ["candidate_name", "application_number", "position"],
    },
    {
        "code": "interview_scheduled",
        "name": "Interview Scheduled",
        "subject": "Interview Scheduled - ATLAS HR",
        "body_html": """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a365d;">Interview Scheduled</h2>
            <p>Dear {{candidate_name}},</p>
            <p>Your interview has been scheduled.</p>
            <p><strong>Round:</strong> {{round}}</p>
            <p><strong>Date:</strong> {{interview_date}}</p>
            <p><strong>Time:</strong> {{interview_time}}</p>
            <p><strong>Interviewer:</strong> {{interviewer_name}}</p>
            <p><strong>Mode:</strong> {{mode}}</p>
            <br>
            <p>Best regards,<br>ATLAS HR Team</p>
        </div>
        """,
        "body_text": "Dear {{candidate_name}}, your {{round}} interview is scheduled for {{interview_date}} at {{interview_time}}.",
        "category": "interview",
        "variables": ["candidate_name", "round", "interview_date", "interview_time", "interviewer_name", "mode"],
    },
    {
        "code": "interview_reminder",
        "name": "Interview Reminder",
        "subject": "Interview Reminder - ATLAS HR",
        "body_html": """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d69e2e;">Interview Reminder</h2>
            <p>Dear {{candidate_name}},</p>
            <p>This is a reminder for your upcoming interview.</p>
            <p><strong>Round:</strong> {{round}}</p>
            <p><strong>Date:</strong> {{interview_date}}</p>
            <p><strong>Time:</strong> {{interview_time}}</p>
            <br>
            <p>Best regards,<br>ATLAS HR Team</p>
        </div>
        """,
        "category": "reminder",
        "variables": ["candidate_name", "round", "interview_date", "interview_time"],
    },
    {
        "code": "offer_generated",
        "name": "Offer Generated",
        "subject": "Offer Letter - ATLAS HR",
        "body_html": """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a365d;">Offer Letter</h2>
            <p>Dear {{candidate_name}},</p>
            <p>We are pleased to extend an offer for the position of <strong>{{position}}</strong>.</p>
            <p><strong>Offer ID:</strong> {{offer_id}}</p>
            <p><strong>CTC:</strong> {{ctc}}</p>
            <p><strong>Joining Date:</strong> {{joining_date}}</p>
            <p>Please review and accept the offer within {{validity_days}} days.</p>
            <br>
            <p>Best regards,<br>ATLAS HR Team</p>
        </div>
        """,
        "category": "offer",
        "variables": ["candidate_name", "position", "offer_id", "ctc", "joining_date", "validity_days"],
    },
    {
        "code": "offer_accepted",
        "name": "Offer Accepted",
        "subject": "Offer Accepted - ATLAS HR",
        "body_html": """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #38a169;">Offer Accepted</h2>
            <p>Dear {{candidate_name}},</p>
            <p>Thank you for accepting the offer. We look forward to welcoming you to the team.</p>
            <p><strong>Position:</strong> {{position}}</p>
            <p><strong>Joining Date:</strong> {{joining_date}}</p>
            <br>
            <p>Best regards,<br>ATLAS HR Team</p>
        </div>
        """,
        "category": "offer",
        "variables": ["candidate_name", "position", "joining_date"],
    },
    {
        "code": "offer_rejected",
        "name": "Offer Rejected",
        "subject": "Offer Status Update - ATLAS HR",
        "body_html": """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e53e3e;">Offer Status Update</h2>
            <p>Dear {{candidate_name}},</p>
            <p>We regret to inform you that the offer has been declined.</p>
            <p>We wish you all the best in your future endeavors.</p>
            <br>
            <p>Best regards,<br>ATLAS HR Team</p>
        </div>
        """,
        "category": "offer",
        "variables": ["candidate_name"],
    },
    {
        "code": "joining_reminder",
        "name": "Joining Reminder",
        "subject": "Joining Reminder - ATLAS HR",
        "body_html": """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d69e2e;">Joining Reminder</h2>
            <p>Dear {{candidate_name}},</p>
            <p>This is a reminder about your upcoming joining date.</p>
            <p><strong>Joining Date:</strong> {{joining_date}}</p>
            <p><strong>Position:</strong> {{position}}</p>
            <p>Please ensure you carry all required documents.</p>
            <br>
            <p>Best regards,<br>ATLAS HR Team</p>
        </div>
        """,
        "category": "reminder",
        "variables": ["candidate_name", "joining_date", "position"],
    },
    {
        "code": "onboarding_started",
        "name": "Onboarding Started",
        "subject": "Welcome to ATLAS HR - Onboarding",
        "body_html": """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a365d;">Welcome to ATLAS!</h2>
            <p>Dear {{employee_name}},</p>
            <p>Your onboarding process has been initiated.</p>
            <p><strong>Employee ID:</strong> {{employee_id}}</p>
            <p><strong>Position:</strong> {{position}}</p>
            <p>Please complete the required steps as outlined in your onboarding dashboard.</p>
            <br>
            <p>Best regards,<br>ATLAS HR Team</p>
        </div>
        """,
        "category": "onboarding",
        "variables": ["employee_name", "employee_id", "position"],
    },
    {
        "code": "document_pending",
        "name": "Document Verification Pending",
        "subject": "Document Verification Required - ATLAS HR",
        "body_html": """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d69e2e;">Document Verification Required</h2>
            <p>Dear {{employee_name}},</p>
            <p>Please upload the following pending documents for verification:</p>
            <ul>{{pending_documents}}</ul>
            <br>
            <p>Best regards,<br>ATLAS HR Team</p>
        </div>
        """,
        "category": "onboarding",
        "variables": ["employee_name", "pending_documents"],
    },
    {
        "code": "employee_activated",
        "name": "Employee Activated",
        "subject": "Welcome Aboard! - ATLAS HR",
        "body_html": """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #38a169;">Welcome Aboard!</h2>
            <p>Dear {{employee_name}},</p>
            <p>Congratulations! Your onboarding is complete and your employee account is now active.</p>
            <p><strong>Employee ID:</strong> {{employee_id}}</p>
            <p><strong>Position:</strong> {{position}}</p>
            <p><strong>Department:</strong> {{department}}</p>
            <br>
            <p>Welcome to the team!<br>ATLAS HR Team</p>
        </div>
        """,
        "category": "onboarding",
        "variables": ["employee_name", "employee_id", "position", "department"],
    },
    {
        "code": "hr_shortlist",
        "name": "HR Shortlist Notification",
        "subject": "Candidate Shortlisted - ATLAS HR",
        "body_html": """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a365d;">Candidate Shortlisted</h2>
            <p>Dear {{recipient_name}},</p>
            <p>The following candidate has been shortlisted by HR:</p>
            <p><strong>Candidate:</strong> {{candidate_name}}</p>
            <p><strong>Position:</strong> {{position}}</p>
            <p><strong>Stage:</strong> {{stage}}</p>
            <br>
            <p>Best regards,<br>ATLAS HR System</p>
        </div>
        """,
        "category": "workflow",
        "variables": ["recipient_name", "candidate_name", "position", "stage"],
    },
    {
        "code": "ceo_review",
        "name": "CEO Review Required",
        "subject": "CEO Review Required - ATLAS HR",
        "body_html": """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a365d;">CEO Review Required</h2>
            <p>Dear CEO,</p>
            <p>A candidate requires your review and final decision.</p>
            <p><strong>Candidate:</strong> {{candidate_name}}</p>
            <p><strong>Position:</strong> {{position}}</p>
            <br>
            <p>Best regards,<br>ATLAS HR System</p>
        </div>
        """,
        "category": "workflow",
        "variables": ["candidate_name", "position"],
    },
]


def seed_email_templates(db: Session) -> int:
    count = 0
    for tmpl in DEFAULT_TEMPLATES:
        existing = db.query(EmailTemplate).filter(EmailTemplate.code == tmpl["code"]).first()
        if not existing:
            db.add(EmailTemplate(**tmpl))
            count += 1
    db.commit()
    return count


def get_template(db: Session, code: str) -> EmailTemplate:
    template = db.query(EmailTemplate).filter(
        EmailTemplate.code == code,
        EmailTemplate.is_active == True,
    ).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Email template '{code}' not found",
        )
    return template


def render_template(template: EmailTemplate, variables: Dict[str, Any]) -> tuple[str, str]:
    html = template.body_html
    text = template.body_text or ""
    for key, value in variables.items():
        html = html.replace("{{" + key + "}}", str(value))
        text = text.replace("{{" + key + "}}", str(value))
    return html, text


def render_subject(template: EmailTemplate, variables: Dict[str, Any]) -> str:
    subject = template.subject
    for key, value in variables.items():
        subject = subject.replace("{{" + key + "}}", str(value))
    return subject


def list_templates(
    db: Session,
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> List[EmailTemplate]:
    query = db.query(EmailTemplate)
    if category:
        query = query.filter(EmailTemplate.category == category)
    if is_active is not None:
        query = query.filter(EmailTemplate.is_active == is_active)
    return query.order_by(EmailTemplate.code).all()


def update_template(
    db: Session,
    code: str,
    subject: Optional[str] = None,
    body_html: Optional[str] = None,
    body_text: Optional[str] = None,
    is_active: Optional[bool] = None,
    variables: Optional[List[str]] = None,
) -> EmailTemplate:
    template = get_template(db, code)
    if subject is not None:
        template.subject = subject
    if body_html is not None:
        template.body_html = body_html
    if body_text is not None:
        template.body_text = body_text
    if is_active is not None:
        template.is_active = is_active
    if variables is not None:
        template.variables = variables
    db.commit()
    db.refresh(template)
    return template
