from pydantic import BaseModel, Field


class SlackIntegrationResponse(BaseModel):
    configured: bool
    webhook_url_masked: str | None = None


class SlackIntegrationUpdate(BaseModel):
    webhook_url: str | None = Field(
        None, description="Slack incoming webhook URL, or null to disconnect"
    )


class SlackTestResponse(BaseModel):
    message: str
