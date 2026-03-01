from pathlib import Path

from dotenv import load_dotenv


PROJECT_ROOT = Path(__file__).resolve().parents[3]
ROOT_ENV_FILE = PROJECT_ROOT / ".env"


def load_project_env() -> None:
    load_dotenv(ROOT_ENV_FILE, override=False)
