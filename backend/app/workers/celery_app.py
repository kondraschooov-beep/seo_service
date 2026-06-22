from celery import Celery
from app.core.settings import settings

broker_url = settings.celery_broker_url or settings.redis_url
result_backend = settings.celery_result_backend or settings.redis_url

celery_app = Celery(
    "seosmartreport",
    broker=broker_url,
    backend=result_backend,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    task_default_retry_delay=30,
    task_max_retries=3,
)
