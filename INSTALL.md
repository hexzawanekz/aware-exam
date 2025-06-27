# Installation Guide

This guide will help you set up and run the N8N Exam Proctoring System on your local machine.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Python 3.8+** (for backend)
- **Node.js 16+** (for frontend)
- **Docker & Docker Compose** (recommended for easy setup)
- **Git** (to clone the repository)

## Quick Start (Recommended)

### Option 1: Using Quick Start Script

1. **Clone the repository:**

   ```bash
   git clone <your-repository-url>
   cd n8n
   ```

2. **Run the quick start script:**

   ```bash
   # For Windows
   ./quick-start.bat

   # For Linux/Mac
   ./quick-start.sh
   ```

3. **Access the applications:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - N8N: http://localhost:5678

### Option 2: Using Docker Compose

1. **Clone and configure:**

   ```bash
   git clone <your-repository-url>
   cd n8n
   cp config.env.example config.env
   ```

2. **Edit `config.env`** with your actual values (see Configuration section below)

3. **Start with Docker:**
   ```bash
   docker-compose up -d
   ```

## Manual Installation

### Backend Setup

1. **Navigate to backend directory:**

   ```bash
   cd backend
   ```

2. **Create virtual environment:**

   ```bash
   python -m venv .venv

   # Activate virtual environment
   # Windows:
   .venv\Scripts\activate
   # Linux/Mac:
   source .venv/bin/activate
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Set up configuration:**

   ```bash
   cp ../config.env.example ../config.env
   # Edit config.env with your actual values
   ```

5. **Run the backend:**
   ```bash
   python main.py
   ```

### Frontend Setup

1. **Navigate to frontend directory:**

   ```bash
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

### N8N Setup

1. **Install N8N globally:**

   ```bash
   npm install -g n8n
   ```

2. **Start N8N:**

   ```bash
   n8n start
   ```

3. **Import workflows:**
   - Access N8N at http://localhost:5678
   - Import workflow files from `workflows/` directory

## Configuration

### Required Configuration

Edit `config.env` with your actual values:

```env
# Google AI API Key (Required)
GOOGLE_AI_API_KEY=your_actual_google_ai_api_key

# Email Configuration (Required for notifications)
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password

# N8N Webhook URL (Required for AI evaluation)
N8N_WEBHOOK_URL=http://localhost:5678/webhook/exam-evaluation
```

### Optional Configuration

```env
# Database (SQLite by default)
DATABASE_URL=sqlite:///recruitment_exam.db

# Face Detection Settings
FACE_DETECTION_MODEL=yolo11
EVIDENCE_THRESHOLD=70
DETECTION_CONFIDENCE=0.5

# Application Settings
DEBUG=False
SECRET_KEY=your_secret_key_here
```

## Getting API Keys

### Google AI API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new project or select existing one
3. Generate an API key
4. Copy the key to your `config.env` file

### Gmail App Password

1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account Settings > Security > App passwords
3. Generate a new app password for "Mail"
4. Use this password in your `config.env` file

## Database Setup

The application uses SQLite by default. The database will be created automatically when you first run the backend.

### Initial Data

To set up initial exam templates and users, you can:

1. **Use the admin interface** (recommended):

   - Access http://localhost:3000/admin
   - Create companies, positions, and exam templates

2. **Import sample data:**
   ```bash
   cd backend
   python create_test_candidate_exams.py
   ```

## Troubleshooting

### Common Issues

1. **Port already in use:**

   - Change ports in `docker-compose.yml` or stop conflicting services

2. **Python virtual environment issues:**

   ```bash
   # Deactivate and recreate
   deactivate
   rm -rf .venv
   python -m venv .venv
   ```

3. **Node.js dependency issues:**

   ```bash
   # Clear cache and reinstall
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Database permission issues:**
   ```bash
   # Ensure write permissions
   chmod 664 backend/recruitment_exam.db
   ```

### Logs

- **Backend logs:** Check console output where you ran `python main.py`
- **Frontend logs:** Check browser console and terminal where you ran `npm start`
- **Docker logs:** `docker-compose logs -f [service-name]`

## Development

### Running in Development Mode

1. **Backend with auto-reload:**

   ```bash
   cd backend
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Frontend with hot reload:**
   ```bash
   cd frontend
   npm start
   ```

### Adding New Features

1. **Backend API endpoints:** Add to `backend/api/v1/`
2. **Frontend components:** Add to `frontend/src/components/`
3. **N8N workflows:** Export from N8N and save to `workflows/`

## Production Deployment

### Using Docker (Recommended)

1. **Build production images:**

   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. **Deploy:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Manual Deployment

1. **Backend:**

   ```bash
   cd backend
   pip install -r requirements.txt
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm run build
   # Serve build/ directory with nginx or similar
   ```

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the logs for error messages
3. Ensure all configuration values are correct
4. Verify all required services are running

## Next Steps

After installation:

1. **Set up your first exam:** Use the admin interface to create exam templates
2. **Configure N8N workflows:** Import and configure the provided workflows
3. **Test the system:** Create a test candidate and run through an exam
4. **Customize:** Modify the interface and workflows to match your needs
