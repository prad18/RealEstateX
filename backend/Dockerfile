# Start with a Python 3.9 base image
FROM python:3.9-slim

# Install system dependencies, including Tesseract OCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /code

# Copy the requirements file and install Python packages
# This is done in a separate step to leverage Docker's layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy the rest of your application code into the container
COPY . .

# Expose the port the app will run on
EXPOSE 8000

# Specify the command to run the app using Gunicorn, a production-ready server
CMD ["gunicorn", "--conf", "gunicorn.conf.py", "main:app"]