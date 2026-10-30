from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

class PreferenceBase(BaseModel):
    font_family: Optional[str] = "inter"
    text_scale: Optional[int] = Field(default=100, ge=80, le=140)
    interface_density: Optional[Literal["compact", "standard", "comfortable", "spacious"]] = "standard"
    theme: Optional[Literal["light", "dark", "system"]] = "system"
    language: Optional[Literal["en", "hi", "mr"]] = "en"
    timezone: Optional[str] = "Asia/Kolkata"
    date_format: Optional[str] = "DD/MM/YYYY"
    time_format: Optional[Literal["12h", "24h"]] = "12h"
    
    high_contrast: Optional[bool] = False
    reduced_motion: Optional[bool] = False
    high_focus: Optional[bool] = False
    sound_enabled: Optional[bool] = True
    
    master_notifications: Optional[bool] = True
    channel_in_app: Optional[bool] = True
    channel_email: Optional[bool] = True
    channel_push: Optional[bool] = False
    
    cat_messages: Optional[bool] = True
    cat_account: Optional[bool] = True
    cat_security: Optional[bool] = True # Always True
    cat_announcements: Optional[bool] = True
    cat_updates: Optional[bool] = True
    cat_reminders: Optional[bool] = True
    cat_marketing: Optional[bool] = False
    
    search_history_enabled: Optional[bool] = True
    search_default_sort: Optional[str] = "newest"
    search_default_filter: Optional[str] = "all"
    
    two_factor_enabled: Optional[bool] = False
    profile_visibility: Optional[Literal["public", "institution", "private"]] = "institution"

class PreferenceUpdate(PreferenceBase):
    pass

class PreferenceResponse(PreferenceBase):
    id: str
    user_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

