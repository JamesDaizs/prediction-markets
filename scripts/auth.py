"""Read Surf API credentials."""

import json
from pathlib import Path

CREDENTIALS_PATH = Path.home() / ".config" / "surf" / "credentials.json"
BASE_URL = "https://api.ask.surf/gateway/v1/prediction-market"


def get_token() -> str:
    """Read Bearer token from Surf credentials file."""
    creds = json.loads(CREDENTIALS_PATH.read_text())
    return creds["surf:default"]["token"]


def get_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {get_token()}",
        "Content-Type": "application/json",
    }
