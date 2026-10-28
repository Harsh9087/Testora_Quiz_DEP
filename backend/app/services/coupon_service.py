import secrets
import csv
import io
import json
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import HTTPException, status

from app.models.coupon import CouponCampaign, Coupon, SystemSetting
from app.models.user import User
from app.models.payment import CreditTransaction
from app.models.exam import AuditLog
from app.utils.timezone import now_utc
from app.schemas.coupon import CouponCampaignCreate

logger = logging.getLogger("uvicorn.error")

# Crockford base32 alphabet: non-ambiguous uppercase characters (omits 0, O, 1, I, L)
CROCKFORD_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"

class CouponService:
    @staticmethod
    def generate_random_chunk(length: int = 4) -> str:
        return "".join(secrets.choice(CROCKFORD_ALPHABET) for _ in range(length))

    @classmethod
    def generate_unique_code(cls, prefix: str = "TESTORA-", db: Optional[Session] = None) -> str:
        cleaned_prefix = prefix.strip().upper()
        if not cleaned_prefix.endswith("-") and cleaned_prefix:
            cleaned_prefix += "-"
        for _ in range(20):
            token = f"{cleaned_prefix}{cls.generate_random_chunk(4)}-{cls.generate_random_chunk(4)}-{cls.generate_random_chunk(4)}"
            if db:
                exists = db.query(Coupon).filter(Coupon.code == token).first()
                if not exists:
                    return token
            else:
                return token
        # Fallback if high collision
        return f"{cleaned_prefix}{secrets.token_hex(6).upper()}"

    @staticmethod
    def get_signup_bonus_config(db: Session) -> tuple[int, int]:
        bonus_credits = 200
        validity_days = 15
        try:
            bonus_row = db.query(SystemSetting).filter(SystemSetting.key == "signup_bonus_credits").first()
            if bonus_row and bonus_row.value:
                bonus_credits = int(bonus_row.value)
            days_row = db.query(SystemSetting).filter(SystemSetting.key == "signup_bonus_validity_days").first()
            if days_row and days_row.value:
                validity_days = int(days_row.value)
        except Exception:
            pass
        return (bonus_credits, validity_days)

    def create_campaign(
        self,
        payload: CouponCampaignCreate,
        creator: User,
        db: Session
    ) -> CouponCampaign:
        """
        Creates a new coupon campaign and generates unique, non-guessable voucher codes.
        Guarantees exact quantity and uniqueness in a single atomic transaction.
        """
        prefix = payload.code_prefix.strip().upper()
        if not prefix.endswith("-") and prefix:
            prefix += "-"

        campaign = CouponCampaign(
            name=payload.name.strip(),
            description=payload.description.strip() if payload.description else None,
            code_prefix=prefix,
            credits_per_coupon=payload.credits_per_coupon,
            credit_type=payload.credit_type,
            bonus_expiry_days=payload.bonus_expiry_days if payload.credit_type == "BONUS" else None,
            total_coupons=payload.total_coupons,
            redeemed_count=0,
            revoked_count=0,
            expires_at=payload.expires_at,
            is_active=True,
            allowed_roles=payload.allowed_roles.strip().lower(),
            max_redemptions_per_user=payload.max_redemptions_per_user,
            created_by=creator.id
        )
        db.add(campaign)
        db.flush()

        # Generate unique codes in memory and check against DB
        generated_codes = set()
        while len(generated_codes) < payload.total_coupons:
            code = self.generate_unique_code(prefix=prefix, db=None)
            generated_codes.add(code)

        # Check in DB for any duplicates among newly generated set
        existing_in_db = set(
            row[0] for row in db.query(Coupon.code).filter(Coupon.code.in_(list(generated_codes))).all()
        )
        while existing_in_db:
            generated_codes -= existing_in_db
            while len(generated_codes) < payload.total_coupons:
                code = self.generate_unique_code(prefix=prefix, db=None)
                generated_codes.add(code)
            existing_in_db = set(
                row[0] for row in db.query(Coupon.code).filter(Coupon.code.in_(list(generated_codes))).all()
            )

        coupons = [
            Coupon(
                campaign_id=campaign.id,
                code=code,
                credits=payload.credits_per_coupon,
                status="UNUSED"
            )
            for code in generated_codes
        ]
        db.bulk_save_objects(coupons)

        # Write audit log
        audit = AuditLog(
            user_id=creator.id,
            action="COUPON_CAMPAIGN_CREATED",
            details=json.dumps({
                "campaign_id": campaign.id,
                "name": campaign.name,
                "total_coupons": campaign.total_coupons,
                "credits_per_coupon": campaign.credits_per_coupon,
                "credit_type": campaign.credit_type
            })
        )
        db.add(audit)
        db.commit()
        db.refresh(campaign)
        return campaign

    def redeem_coupon(
        self,
        code: str,
        user: User,
        db: Session
    ) -> Dict[str, Any]:
        """
        Atomically redeems a voucher code for a user.
        Validates campaign status, expiration, user eligibility, and duplicate redemptions.
        Integrates directly with user wallet and creates an immutable CreditTransaction.
        """
        normalized_code = code.strip().upper()

        # Use row-level locking where supported (PostgreSQL: with_for_update, SQLite: transaction lock)
        coupon_query = db.query(Coupon).filter(
            Coupon.code == normalized_code,
            Coupon.is_deleted == False
        )
        try:
            coupon = coupon_query.with_for_update().first()
        except Exception:
            coupon = coupon_query.first()

        if not coupon:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid coupon code. Please check and try again."
            )

        if coupon.status == "REDEEMED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This coupon has already been redeemed."
            )

        if coupon.status == "REVOKED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This coupon has been revoked by an administrator."
            )

        if coupon.status != "UNUSED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"This coupon cannot be redeemed (status: {coupon.status})."
            )

        campaign = db.query(CouponCampaign).filter(
            CouponCampaign.id == coupon.campaign_id,
            CouponCampaign.is_deleted == False
        ).first()

        if not campaign or not campaign.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This coupon campaign is no longer active."
            )

        # Expiry check
        now = now_utc()
        if campaign.expires_at:
            exp = campaign.expires_at
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if now > exp:
                coupon.status = "EXPIRED"
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This coupon has expired."
                )

        # Role eligibility check
        allowed = [r.strip().lower() for r in campaign.allowed_roles.split(",") if r.strip()]
        if allowed and user.role.lower() not in allowed and "all" not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This coupon is restricted to roles: {', '.join(allowed)}. Your role is '{user.role}'."
            )

        # Max redemption per user check
        user_prior_redemptions = db.query(Coupon).filter(
            Coupon.campaign_id == campaign.id,
            Coupon.redeemed_by_user_id == user.id,
            Coupon.status == "REDEEMED"
        ).count()

        if user_prior_redemptions >= campaign.max_redemptions_per_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"You have already redeemed the maximum allowed vouchers ({campaign.max_redemptions_per_user}) from this campaign."
            )

        # Re-fetch fresh user to avoid stale balance
        fresh_user = db.query(User).filter(User.id == user.id).first()
        if not fresh_user:
            raise HTTPException(status_code=404, detail="User account not found")

        # Atomic Compare-And-Swap to guarantee exactly-once redemption under concurrency
        rows_updated = db.query(Coupon).filter(
            Coupon.id == coupon.id,
            Coupon.status == "UNUSED"
        ).update(
            {
                Coupon.status: "REDEEMED",
                Coupon.redeemed_by_user_id: fresh_user.id,
                Coupon.redeemed_at: now
            },
            synchronize_session=False
        )
        if rows_updated == 0:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This coupon has already been redeemed."
            )

        # Credit user balance
        credits_to_add = coupon.credits
        if campaign.credit_type == "BONUS":
            fresh_user.bonus_credits = (fresh_user.bonus_credits or 0) + credits_to_add
            bonus_days = campaign.bonus_expiry_days or 15
            new_exp = now + timedelta(days=bonus_days)
            if fresh_user.bonus_credits_expires_at:
                curr_exp = fresh_user.bonus_credits_expires_at
                if curr_exp.tzinfo is None:
                    curr_exp = curr_exp.replace(tzinfo=timezone.utc)
                fresh_user.bonus_credits_expires_at = max(curr_exp, new_exp)
            else:
                fresh_user.bonus_credits_expires_at = new_exp
        else:
            # Regular paid credits
            fresh_user.credits_balance = (fresh_user.credits_balance or 0) + credits_to_add

        new_total_balance = fresh_user.total_available_credits
        campaign.redeemed_count = (campaign.redeemed_count or 0) + 1

        # Record immutable ledger transaction
        credit_tx = CreditTransaction(
            user_id=fresh_user.id,
            transaction_type="COUPON_REDEMPTION",
            amount_credits=credits_to_add,
            balance_after=new_total_balance,
            description=f"Redeemed voucher {coupon.code} ({campaign.name})"
        )
        db.add(credit_tx)

        # Record AuditLog
        audit = AuditLog(
            user_id=fresh_user.id,
            action="COUPON_REDEEMED",
            details=json.dumps({
                "coupon_id": coupon.id,
                "code": coupon.code,
                "campaign_id": campaign.id,
                "campaign_name": campaign.name,
                "credits_added": credits_to_add,
                "credit_type": campaign.credit_type,
                "new_balance": new_total_balance
            })
        )
        db.add(audit)
        db.commit()
        db.refresh(fresh_user)

        logger.info(f"[COUPON_REDEEMED] User {fresh_user.id} ({fresh_user.email}) redeemed {coupon.code} for +{credits_to_add} credits.")

        return {
            "success": True,
            "credits_added": credits_to_add,
            "credit_type": campaign.credit_type,
            "new_balance": new_total_balance,
            "campaign_name": campaign.name,
            "message": f"Successfully redeemed {credits_to_add:,} credits from '{campaign.name}'!"
        }

    def revoke_campaign(self, campaign_id: str, admin_user: User, db: Session) -> CouponCampaign:
        """Revokes all unused vouchers in a campaign."""
        campaign = db.query(CouponCampaign).filter(
            CouponCampaign.id == campaign_id,
            CouponCampaign.is_deleted == False
        ).first()
        if not campaign:
            raise HTTPException(status_code=404, detail="Coupon campaign not found")

        now = now_utc()
        unused_coupons = db.query(Coupon).filter(
            Coupon.campaign_id == campaign.id,
            Coupon.status == "UNUSED"
        ).all()

        for c in unused_coupons:
            c.status = "REVOKED"
            c.revoked_by = admin_user.id
            c.revoked_at = now
            c.revoked_reason = "Campaign revoked by administrator"

        campaign.revoked_count = (campaign.revoked_count or 0) + len(unused_coupons)
        campaign.is_active = False

        audit = AuditLog(
            user_id=admin_user.id,
            action="COUPON_CAMPAIGN_REVOKED",
            details=json.dumps({
                "campaign_id": campaign.id,
                "revoked_count": len(unused_coupons)
            })
        )
        db.add(audit)
        db.commit()
        db.refresh(campaign)
        return campaign

    def revoke_coupon(self, coupon_id: str, admin_user: User, reason: Optional[str], db: Session) -> Coupon:
        """Revokes an individual unused voucher."""
        coupon = db.query(Coupon).filter(
            Coupon.id == coupon_id,
            Coupon.is_deleted == False
        ).first()
        if not coupon:
            raise HTTPException(status_code=404, detail="Coupon not found")

        if coupon.status == "REDEEMED":
            raise HTTPException(status_code=400, detail="Cannot revoke an already redeemed coupon")

        coupon.status = "REVOKED"
        coupon.revoked_by = admin_user.id
        coupon.revoked_at = now_utc()
        coupon.revoked_reason = reason or "Revoked by administrator"

        # Increment campaign revoked count
        campaign = db.query(CouponCampaign).filter(CouponCampaign.id == coupon.campaign_id).first()
        if campaign:
            campaign.revoked_count = (campaign.revoked_count or 0) + 1

        audit = AuditLog(
            user_id=admin_user.id,
            action="COUPON_REVOKED",
            details=json.dumps({
                "coupon_id": coupon.id,
                "code": coupon.code,
                "reason": reason
            })
        )
        db.add(audit)
        db.commit()
        db.refresh(coupon)
        return coupon

    def export_campaign_csv(self, campaign_id: str, db: Session) -> str:
        """Generates CSV format of all coupons in a campaign."""
        campaign = db.query(CouponCampaign).filter(
            CouponCampaign.id == campaign_id,
            CouponCampaign.is_deleted == False
        ).first()
        if not campaign:
            raise HTTPException(status_code=404, detail="Coupon campaign not found")

        coupons = db.query(Coupon).filter(
            Coupon.campaign_id == campaign.id,
            Coupon.is_deleted == False
        ).order_by(Coupon.created_at.asc()).all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Campaign Name", "Voucher Code", "Credits", "Credit Type", "Status", "Redeemed At", "Expires At"])
        for c in coupons:
            writer.writerow([
                campaign.name,
                c.code,
                c.credits,
                campaign.credit_type,
                c.status,
                c.redeemed_at.isoformat() if c.redeemed_at else "",
                campaign.expires_at.isoformat() if campaign.expires_at else "Never"
            ])
        return output.getvalue()

coupon_service = CouponService()
