from app.models import User, db
from app.services.file_service import FileService
from datetime import datetime
import uuid

class UserService:
    def get_user_by_id(self, user_id):
        """Get user by ID"""
        return User.query.get(user_id)
    
    def update_user_profile(self, user_id, data):
        """Update user profile"""
        user = User.query.get(user_id)
        if not user:
            return None
        
        for key, value in data.items():
            if hasattr(user, key):
                setattr(user, key, value)
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return user
    
    def upload_avatar(self, user_id, file):
        """Upload user avatar"""
        user = User.query.get(user_id)
        if not user:
            return None
        
        file_service = FileService()
        avatar_url = file_service.upload_file(file, 'avatars')
        
        user.avatar = avatar_url
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return avatar_url
    
    def change_password(self, user_id, current_password, new_password):
        """Change user password"""
        user = User.query.get(user_id)
        if not user:
            return False
        
        if not user.check_password(current_password):
            return False
        
        user.set_password(new_password)
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return True
    
    def get_user_preferences(self, user_id):
        """Get user preferences"""
        # This would typically be stored in a separate preferences table
        return {
            'notifications': True,
            'emailUpdates': True,
            'theme': 'light'
        }
    
    def update_user_preferences(self, user_id, data):
        """Update user preferences"""
        # This would typically update a separate preferences table
        return data
    
    def get_user_notifications(self, user_id):
        """Get user notifications"""
        # This would typically query a notifications table
        return []
    
    def mark_notification_read(self, user_id, notification_id):
        """Mark notification as read"""
        # This would typically update a notifications table
        return True
    
    def get_user_activity(self, user_id):
        """Get user activity"""
        # This would typically query an activity log table
        return []
