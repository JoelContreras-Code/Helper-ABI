"""Worker configuration loaded from the repository root `.env.<NODE_ENV>` file."""

import os
from pathlib import Path
from typing import Literal

from pydantic import Field, HttpUrl, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[2]

# Project rule: never hit a source faster than one request every 2 seconds.
MIN_REQUEST_DELAY_MS = 2000


def default_env_file() -> Path:
    """Returns the env file for the current NODE_ENV (development by default)."""
    return ROOT_DIR / f".env.{os.environ.get('NODE_ENV', 'development')}"


class Settings(BaseSettings):
    """Validated settings. Real environment variables override the env file."""

    model_config = SettingsConfigDict(extra="ignore", env_file_encoding="utf-8")

    node_env: Literal["development", "test", "production"] = "development"
    api_base_url: HttpUrl = HttpUrl("http://127.0.0.1:4000")
    ingest_token: SecretStr | None = None
    lmstudio_url: HttpUrl = HttpUrl("http://localhost:1234/v1")
    llm_text_model: str = "qwen2.5-7b-instruct"
    llm_vision_model: str = "qwen2.5-vl-7b-instruct"
    http_user_agent: str = Field(default="HelperABI-Centinela/0.1 (personal use)", min_length=8)
    http_min_delay_ms: int = Field(default=MIN_REQUEST_DELAY_MS, ge=MIN_REQUEST_DELAY_MS)
    youtube_api_key: SecretStr | None = None


def load_settings(env_file: Path | None = None) -> Settings:
    """Loads settings from `env_file` (or the default one, if it exists)."""
    path = env_file or default_env_file()
    return Settings(_env_file=path if path.exists() else None)  # type: ignore[call-arg]
