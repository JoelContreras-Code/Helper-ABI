from pathlib import Path

import pytest
from pydantic import ValidationError

from common.settings import MIN_REQUEST_DELAY_MS, Settings, load_settings

ENV_VARS = (
    "NODE_ENV",
    "API_BASE_URL",
    "INGEST_TOKEN",
    "LMSTUDIO_URL",
    "HTTP_USER_AGENT",
    "HTTP_MIN_DELAY_MS",
    "YOUTUBE_API_KEY",
)


@pytest.fixture(autouse=True)
def clean_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """Isolates every test from the developer's real environment."""
    for name in ENV_VARS:
        monkeypatch.delenv(name, raising=False)


def test_defaults_are_safe(tmp_path: Path) -> None:
    settings = load_settings(tmp_path / "missing.env")
    assert settings.http_min_delay_ms == MIN_REQUEST_DELAY_MS
    assert str(settings.api_base_url) == "http://127.0.0.1:4000/"
    assert settings.ingest_token is None


def test_reads_values_from_env_file(tmp_path: Path) -> None:
    env_file = tmp_path / ".env.test"
    env_file.write_text(
        "API_BASE_URL=http://127.0.0.1:4100\n"
        "INGEST_TOKEN=dummy-token-for-tests\n"
        "HTTP_MIN_DELAY_MS=3000\n"
        "UNRELATED_VARIABLE=ignored\n",
        encoding="utf-8",
    )
    settings = load_settings(env_file)
    assert str(settings.api_base_url) == "http://127.0.0.1:4100/"
    assert settings.http_min_delay_ms == 3000
    assert settings.ingest_token is not None
    assert settings.ingest_token.get_secret_value() == "dummy-token-for-tests"


def test_secrets_are_not_printed() -> None:
    settings = Settings(ingest_token="dummy-token-for-tests")
    assert "dummy-token-for-tests" not in repr(settings)


def test_rejects_delays_below_two_seconds(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("HTTP_MIN_DELAY_MS", "500")
    with pytest.raises(ValidationError):
        Settings()
