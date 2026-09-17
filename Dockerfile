# IT Support Desk - FastAPI backend image
#
# The application uses flat Python imports (e.g. `from controllers...`,
# `import config`, `from database...`), so ITSupport/ is the working
# directory. Environment variables (including secrets) are injected at
# container runtime via docker-compose env_file; the image itself contains
# no .env and no credentials.

FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY ITSupport/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY ITSupport/ /app/

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]