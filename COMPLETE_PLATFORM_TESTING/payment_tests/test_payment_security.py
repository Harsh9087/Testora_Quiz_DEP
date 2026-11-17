import hmac
import hashlib
import pytest
from httpx import AsyncClient

def verify_razorpay_signature(order_id: str, payment_id: str, signature: str, secret: str) -> bool:
    message = f"{order_id}|{payment_id}".encode("utf-8")
    generated = hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()
    return hmac.compare_digest(generated, signature)

def test_hmac_sha256_signature_verification():
    secret = "rzp_test_secret_key_12345"
    order_id = "order_N1234567890"
    payment_id = "pay_P9876543210"

    message = f"{order_id}|{payment_id}".encode("utf-8")
    valid_signature = hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()

    # Assert valid signature passes
    assert verify_razorpay_signature(order_id, payment_id, valid_signature, secret) is True

    # Assert tampered signature fails
    tampered_sig = valid_signature[:-4] + "ffff"
    assert verify_razorpay_signature(order_id, payment_id, tampered_sig, secret) is False

def test_integer_paise_arithmetic():
    """Verify that credit and payment calculations never suffer from IEEE 754 float precision errors."""
    rupees_amount = 499.0
    amount_in_paise = int(round(rupees_amount * 100))
    assert amount_in_paise == 49900
    assert isinstance(amount_in_paise, int)

    discount_rupees = 50.0
    discount_paise = int(round(discount_rupees * 100))
    final_paise = amount_in_paise - discount_paise
    assert final_paise == 44900
