import json
import os
from .config import settings

CONFIG_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "smtp_config.json")

def get_smtp_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r") as f:
                data = json.load(f)
                return {
                    "SMTP_USER": data.get("smtp_user", settings.SMTP_USER),
                    "SMTP_PASSWORD": data.get("smtp_password", settings.SMTP_PASSWORD)
                }
        except Exception:
            pass
    
    return {
        "SMTP_USER": settings.SMTP_USER,
        "SMTP_PASSWORD": settings.SMTP_PASSWORD
    }

def set_smtp_config(smtp_user: str, smtp_password: str):
    data = {
        "smtp_user": smtp_user,
        "smtp_password": smtp_password
    }
    with open(CONFIG_FILE, "w") as f:
        json.dump(data, f)
    return True
