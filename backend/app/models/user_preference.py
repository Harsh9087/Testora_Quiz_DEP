from sqlalchemy import Column, String, ForeignKey, Integer, Boolean
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class UserPreference(TimeStampedModel):
    __tablename__ = "user_preferences"
    
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, index=True, nullable=False)
    
    # Appearance & Personalization
    font_family = Column(String(50), default="inter", nullable=False)  # inter, sans, serif, arial, dyslexic
    text_scale = Column(Integer, default=100, nullable=False)           # 85, 100, 115, 130
    interface_density = Column(String(50), default="standard", nullable=False) # compact, standard, comfortable, spacious
    theme = Column(String(50), default="system", nullable=False)        # light, dark, system
    
    # Language & Regional
    language = Column(String(10), default="en", nullable=False)         # en, hi, mr
    timezone = Column(String(100), default="Asia/Kolkata", nullable=False)
    date_format = Column(String(50), default="DD/MM/YYYY", nullable=False) # DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
    time_format = Column(String(10), default="12h", nullable=False)     # 12h, 24h
    
    # Accessibility
    high_contrast = Column(Boolean, default=False, nullable=False)
    reduced_motion = Column(Boolean, default=False, nullable=False)
    high_focus = Column(Boolean, default=False, nullable=False)
    sound_enabled = Column(Boolean, default=True, nullable=False)
    
    # Notification Channels
    master_notifications = Column(Boolean, default=True, nullable=False)
    channel_in_app = Column(Boolean, default=True, nullable=False)
    channel_email = Column(Boolean, default=True, nullable=False)
    channel_push = Column(Boolean, default=False, nullable=False)
    
    # Notification Categories
    cat_messages = Column(Boolean, default=True, nullable=False)
    cat_account = Column(Boolean, default=True, nullable=False)
    cat_security = Column(Boolean, default=True, nullable=False) # Always true, immutable security alerts
    cat_announcements = Column(Boolean, default=True, nullable=False)
    cat_updates = Column(Boolean, default=True, nullable=False)
    cat_reminders = Column(Boolean, default=True, nullable=False)
    cat_marketing = Column(Boolean, default=False, nullable=False)
    
    # Search Preferences
    search_history_enabled = Column(Boolean, default=True, nullable=False)
    search_default_sort = Column(String(50), default="newest", nullable=False) # newest, oldest, name_asc, name_desc
    search_default_filter = Column(String(50), default="all", nullable=False)  # all, active, completed
    
    # Privacy & Security
    two_factor_enabled = Column(Boolean, default=False, nullable=False)
    profile_visibility = Column(String(50), default="institution", nullable=False) # public, institution, private
    
    # Relationship
    user = relationship("User", backref="preferences", uselist=False)

