import os
from werkzeug.utils import secure_filename
from PIL import Image
import uuid

class FileService:
    def __init__(self):
        self.upload_folder = os.environ.get('UPLOAD_FOLDER', 'uploads')
        self.allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx'}
        self.max_file_size = 16 * 1024 * 1024  # 16MB
    
    def upload_file(self, file, folder='general'):
        """Upload file and return URL"""
        if not self._allowed_file(file.filename):
            raise ValueError('File type not allowed')
        
        if file.content_length and file.content_length > self.max_file_size:
            raise ValueError('File too large')
        
        # Generate unique filename
        filename = secure_filename(file.filename)
        name, ext = os.path.splitext(filename)
        unique_filename = f"{uuid.uuid4()}{ext}"
        
        # Create folder if it doesn't exist
        upload_path = os.path.join(self.upload_folder, folder)
        os.makedirs(upload_path, exist_ok=True)
        
        # Save file
        file_path = os.path.join(upload_path, unique_filename)
        file.save(file_path)
        
        # Process image if it's an image
        if self._is_image(filename):
            self._process_image(file_path)
        
        # Return URL
        return f"/uploads/{folder}/{unique_filename}"
    
    def delete_file(self, file_url):
        """Delete file by URL"""
        try:
            file_path = file_url.replace('/uploads/', f'{self.upload_folder}/')
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
        except Exception as e:
            print(f"Error deleting file: {e}")
        
        return False
    
    def _allowed_file(self, filename):
        """Check if file extension is allowed"""
        if not filename:
            return False
        
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in self.allowed_extensions
    
    def _is_image(self, filename):
        """Check if file is an image"""
        if not filename:
            return False
        
        return filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}
    
    def _process_image(self, file_path):
        """Process image (resize, optimize)"""
        try:
            with Image.open(file_path) as img:
                # Resize if too large
                if img.width > 1920 or img.height > 1080:
                    img.thumbnail((1920, 1080), Image.Resampling.LANCZOS)
                    img.save(file_path, optimize=True, quality=85)
        except Exception as e:
            print(f"Error processing image: {e}")
    
    def get_file_info(self, file_url):
        """Get file information"""
        try:
            file_path = file_url.replace('/uploads/', f'{self.upload_folder}/')
            if os.path.exists(file_path):
                stat = os.stat(file_path)
                return {
                    'size': stat.st_size,
                    'modified': stat.st_mtime,
                    'exists': True
                }
        except Exception as e:
            print(f"Error getting file info: {e}")
        
        return {'exists': False}
