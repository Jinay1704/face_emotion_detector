FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from backend subfolder
COPY requirements.txt .

RUN pip install --no-cache-dir --timeout=1000 -r requirements.txt

# Copy all backend code
COPY . .

EXPOSE 5001

CMD ["python", "app.py"]
