FROM python:3.12-slim AS dependencies
WORKDIR /build
COPY . .
RUN python -m venv /opt/venv && \
    if [ -d .wheelhouse ]; then \
      /opt/venv/bin/pip install --no-cache-dir --no-index --find-links=.wheelhouse --require-hashes -r requirements.lock; \
    else \
      /opt/venv/bin/pip install --no-cache-dir --require-hashes -r requirements.lock; \
    fi

FROM python:3.12-slim
COPY --from=dependencies /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
WORKDIR /app
COPY --chmod=644 main.py .
USER 65534:65534
EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--limit-concurrency", "12"]
