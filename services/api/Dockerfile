FROM python:3.12.10-slim
WORKDIR /app
COPY requirements.lock.txt ./
RUN pip install --no-cache-dir --require-hashes -r requirements.lock.txt
COPY pipeline ./pipeline
COPY config ./config
COPY services ./services
COPY apps/web/public/data ./apps/web/public/data
COPY docs/evidence/cap_xsd_fixed.xsd ./docs/evidence/cap_xsd_fixed.xsd
EXPOSE 8000
CMD ["uvicorn", "services.api.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--no-access-log"]
