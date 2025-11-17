FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Install system dependencies for psycopg / network tools
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    libpq5 \
    iputils-ping \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from the current folder (Dockerfile is here)
COPY requirements.txt /app/

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy all project files
COPY . /app/
