# Backend (FastAPI)

## Quickstart

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# copy env
cp .env.example .env

# make sure Postgres is running and DB exists
uvicorn app.main:app --reload
```

## Migrations (Alembic)
```bash
alembic revision --autogenerate -m "init"
alembic upgrade head
```

If you already ran migrations, generate a new one after model changes:
```bash
alembic revision --autogenerate -m "update schema"
alembic upgrade head
```

## Celery
```bash
celery -A app.workers.celery_app.celery_app worker --loglevel=info
```

## Endpoints
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/token`
- `GET /api/v1/projects`
- `POST /api/v1/projects`
- `GET /api/v1/integrations`
- `POST /api/v1/integrations`
- `PATCH /api/v1/integrations/{integration_id}`
- `POST /api/v1/integrations/yandex/oauth/exchange`
- `POST /api/v1/integrations/yandex/oauth/url`
- `POST /api/v1/integrations/gsc/oauth/exchange`
- `POST /api/v1/integrations/gsc/oauth/url`
- `GET /api/v1/integrations/yandex/metrika/counters`
- `GET /api/v1/integrations/yandex/webmaster/hosts`
- `GET /api/v1/integrations/gsc/sites`
- `POST /api/v1/integrations/gsc/search-analytics`
- `GET /api/v1/integrations/topvisor/projects`
- `GET /api/v1/integrations/topvisor/positions?project_id=...`
- `POST /api/v1/reports/generate`
- `GET /api/v1/reports/{id}`
- `GET /api/v1/reports/{id}/download`
- `GET /api/v1/reports/{id}/data`
- `GET /api/v1/reports/{id}/comments`
- `PUT /api/v1/reports/{id}/comments/{comment_id}`
- `POST /api/v1/reports/{id}/render`
- `POST /api/v1/reports/{id}/preview`
- `GET /api/v1/reports/{id}/preview/download`
- `GET /api/v1/reports/{id}/logs`

## Report status flow
`draft` → `collecting` → `ready` → `preview_ready` → `final`
Errors set status to `error` and the task will retry up to 3 times.

## Frontend MVP
Open `frontend/public/index.html` in a browser to use the minimal UI.

## Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

## Notes
- For Yandex/GSC OAuth, use the UI to generate the auth URL and complete the flow in your browser.
- After saving `meta` (counter_id/site_url/host_id/project_id), regenerate the report to pull richer data.

## Quick flow
1. Register and login to get a token.
2. Create a project.
3. Connect integrations (OAuth exchange).
4. Save integration `meta` (GSC site_url, Metrika counter_id, Webmaster host_id, Topvisor project_id).
5. Generate report (data collection).
6. Preview PDF.
7. Edit AI comments.
8. Render final PDF and download.

## Notes
- Tables auto-create on startup for dev.
- Replace `JWT_SECRET_KEY` for production.
