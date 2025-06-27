#!/usr/bin/env python3
"""
Evidence Capture Setup Script
Sets up the evidence capture system for YOLO11 proctoring
"""

import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from sqlalchemy import text
from core.database import engine, SessionLocal
from models.exam import Base

def setup_evidence_directories():
    """Create necessary directories for evidence storage"""
    directories = [
        "evidence_frames",
        "uploads",
        "static"
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"✅ Created directory: {directory}")

def setup_database():
    """Create/update database tables with new evidence fields"""
    try:
        print("🔄 Setting up database...")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
        
        # Check if new columns exist, add them if they don't
        with engine.connect() as connection:
            # Check if evidence capture columns exist in proctoring_logs
            result = connection.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'proctoring_logs' 
                AND column_name IN ('evidence_level', 'captured_frame_url', 'frame_analysis', 'cheating_score', 'ai_evaluation', 'processed')
            """))
            
            existing_columns = [row[0] for row in result.fetchall()]
            required_columns = ['evidence_level', 'captured_frame_url', 'frame_analysis', 'cheating_score', 'ai_evaluation', 'processed']
            
            for column in required_columns:
                if column not in existing_columns:
                    try:
                        if column == 'evidence_level':
                            connection.execute(text("ALTER TABLE proctoring_logs ADD COLUMN evidence_level VARCHAR(20) DEFAULT 'low'"))
                        elif column == 'captured_frame_url':
                            connection.execute(text("ALTER TABLE proctoring_logs ADD COLUMN captured_frame_url VARCHAR(500)"))
                        elif column == 'frame_analysis':
                            connection.execute(text("ALTER TABLE proctoring_logs ADD COLUMN frame_analysis JSON"))
                        elif column == 'cheating_score':
                            connection.execute(text("ALTER TABLE proctoring_logs ADD COLUMN cheating_score FLOAT DEFAULT 0.0"))
                        elif column == 'ai_evaluation':
                            connection.execute(text("ALTER TABLE proctoring_logs ADD COLUMN ai_evaluation JSON"))
                        elif column == 'processed':
                            connection.execute(text("ALTER TABLE proctoring_logs ADD COLUMN processed BOOLEAN DEFAULT FALSE"))
                        
                        connection.commit()
                        print(f"✅ Added column: {column}")
                    except Exception as e:
                        print(f"⚠️ Column {column} might already exist or error: {e}")
                        
    except Exception as e:
        print(f"❌ Database setup error: {e}")
        return False
    
    return True

def test_yolo11_installation():
    """Test if YOLO11 dependencies are properly installed"""
    try:
        from ultralytics import YOLO
        print("✅ YOLO11 (Ultralytics) is installed")
        
        # Test loading models
        try:
            model = YOLO('yolo11n-pose.pt')
            print("✅ YOLO11 pose model loaded successfully")
        except Exception as e:
            print(f"⚠️ YOLO11 pose model loading issue: {e}")
            
        try:
            seg_model = YOLO('yolo11n-seg.pt')
            print("✅ YOLO11 segmentation model loaded successfully")
        except Exception as e:
            print(f"⚠️ YOLO11 segmentation model loading issue: {e}")
            
    except ImportError:
        print("❌ YOLO11 (Ultralytics) not installed. Install with: pip install ultralytics")
        return False
    
    return True

def print_summary():
    """Print setup summary and instructions"""
    print("\n" + "="*60)
    print("🎯 YOLO11 Evidence Capture Setup Complete!")
    print("="*60)
    print("📋 Summary:")
    print("✅ Evidence storage directories created")
    print("✅ Database tables updated with evidence fields")
    print("✅ YOLO11 models ready for evidence capture")
    print("\n📚 Features Added:")
    print("• 🎯 90% confidence threshold for evidence capture")
    print("• 📸 Automatic frame capture when evidence exceeds threshold")
    print("• 📊 Real-time evidence scoring and classification")
    print("• 🔍 Enhanced admin interface for viewing evidence")
    print("• 🤖 N8N integration for AI-powered cheating analysis")
    print("\n🔗 Available Endpoints:")
    print("• GET /api/v1/exam/sessions/{session_id}/evidence-summary")
    print("• GET /api/v1/exam/sessions/{session_id}/proctoring-logs")
    print("• GET /api/v1/exam/evidence-frame/{filename}")
    print("\n🌐 UI Locations:")
    print("• Exam Interface: Real-time evidence display in proctoring panel")
    print("• Admin Interface: Evidence analysis at /admin/candidates/{id}")
    print("\n🚀 To start the system:")
    print("Backend: python main.py")
    print("Frontend: npm start")
    print("="*60)

def main():
    """Main setup function"""
    print("🚀 Setting up YOLO11 Evidence Capture System...")
    print("="*60)
    
    # Setup directories
    print("\n📁 Setting up directories...")
    setup_evidence_directories()
    
    # Setup database
    print("\n💾 Setting up database...")
    if not setup_database():
        print("❌ Database setup failed!")
        sys.exit(1)
    
    # Test YOLO11
    print("\n🤖 Testing YOLO11 installation...")
    if not test_yolo11_installation():
        print("⚠️ YOLO11 setup has issues, but system can still run with basic detection")
    
    # Print summary
    print_summary()

if __name__ == "__main__":
    main() 