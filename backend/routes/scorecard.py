from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any, List
from utils.sap_scorecard_data import SAP_TOPICS, RATING_SCALE, OVERALL_ASSESSMENT_FIELDS, SAP_DOMAINS

router = APIRouter(
    prefix="/api/scorecard",
    tags=["scorecard"]
)

@router.get("/domains", response_model=dict)
def get_domains_api():
    return {
        "success": True,
        "domains": SAP_DOMAINS
    }

@router.get("/{domain}", response_model=dict)
def get_scorecard_api(domain: str):
    domain_upper = domain.upper()
    if domain_upper not in SAP_TOPICS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"SAP domain '{domain}' not found. Valid domains: {', '.join(SAP_DOMAINS)}"
        )
    return {
        "success": True,
        "domain": domain_upper,
        "topics": SAP_TOPICS[domain_upper],
        "rating_scale": RATING_SCALE,
        "overall_fields": OVERALL_ASSESSMENT_FIELDS
    }
