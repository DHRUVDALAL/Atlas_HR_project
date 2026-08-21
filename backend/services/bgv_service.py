import os
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from models.offer_onboarding import BackgroundVerification


class BGVProvider:
    """Base class for background verification providers."""
    name: str = "base"

    def verify_employment(self, data: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

    def verify_education(self, data: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

    def verify_identity(self, data: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

    def verify_address(self, data: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

    def verify_police(self, data: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError


class MockBGVProvider(BGVProvider):
    name = "mock"

    def verify_employment(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "status": "cleared",
            "provider": self.name,
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "details": "Mock verification passed",
        }

    def verify_education(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "status": "cleared",
            "provider": self.name,
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "details": "Mock verification passed",
        }

    def verify_identity(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "status": "cleared",
            "provider": self.name,
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "details": "Mock verification passed",
        }

    def verify_address(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "status": "cleared",
            "provider": self.name,
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "details": "Mock verification passed",
        }

    def verify_police(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "status": "cleared",
            "provider": self.name,
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "details": "Mock verification passed",
        }


PROVIDERS: Dict[str, BGVProvider] = {
    "mock": MockBGVProvider(),
}


def get_provider(name: Optional[str] = None) -> BGVProvider:
    provider_name = name or os.getenv("BGV_PROVIDER", "mock")
    provider = PROVIDERS.get(provider_name)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown BGV provider: {provider_name}",
        )
    return provider


def run_verification(
    db: Session,
    bgv_id: UUID,
    category: str,
    data: Dict[str, Any],
    provider_name: Optional[str] = None,
) -> BackgroundVerification:
    bgv = db.query(BackgroundVerification).filter(BackgroundVerification.bgv_id == bgv_id).first()
    if not bgv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="BGV record not found")

    provider = get_provider(provider_name)
    method_name = f"verify_{category}"
    method = getattr(provider, method_name, None)
    if not method:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Provider does not support verification category: {category}",
        )

    result = method(data)

    bgv.status = "CLEARED" if result.get("status") == "cleared" else "FAILED"
    bgv.verified_at = datetime.now(timezone.utc)
    bgv.verified_by = provider.name
    bgv.notes = result.get("details", "")
    db.commit()
    db.refresh(bgv)
    return bgv


def get_bgv_status(db: Session, onboarding_id: UUID) -> List[BackgroundVerification]:
    return (
        db.query(BackgroundVerification)
        .filter(BackgroundVerification.onboarding_id == onboarding_id)
        .all()
    )
