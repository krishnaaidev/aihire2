import os
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

_firebase_initialized = False

try:
    import firebase_admin
    from firebase_admin import credentials, auth
    
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        _firebase_initialized = True
        logger.info(f"Firebase Admin SDK initialized successfully for Authentication: {cred_path}")
    elif os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        firebase_admin.initialize_app()
        _firebase_initialized = True
        logger.info("Firebase Admin SDK initialized with default application credentials for Authentication")
    else:
        logger.info("Firebase Admin SDK available for Authentication (credentials file optional)")
except Exception as e:
    logger.warning(f"Firebase Admin SDK could not be initialized: {e}")

def is_firebase_ready() -> bool:
    """Return True if Firebase Admin SDK is initialized with valid credentials."""
    return _firebase_initialized

def verify_firebase_id_token(id_token: str) -> Optional[Dict[str, Any]]:
    """
    Verify a Firebase ID token sent from frontend.
    Returns decoded token dictionary or None if invalid or unconfigured.
    """
    if not _firebase_initialized:
        return None
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        logger.error(f"Error verifying Firebase ID token: {e}")
        return None
