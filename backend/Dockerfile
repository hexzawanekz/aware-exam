FROM python:3.9-slim

# Install system dependencies for face recognition
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    libboost-python-dev \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    git \
    wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Upgrade pip and install wheel for faster builds
RUN pip install --upgrade pip setuptools wheel

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python packages with optimizations
RUN pip install --no-cache-dir \
    --find-links https://download.pytorch.org/whl/torch_stable.html \
    --prefer-binary \
    -r requirements.txt

# Copy application code
COPY . .

# Create directories for uploads and face detection
RUN mkdir -p /app/uploads /app/face_recognition_data /app/exam_videos /app/credentials

# Create non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"] 