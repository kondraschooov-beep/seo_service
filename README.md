# SEOSmartReport

Monorepo scaffold:
- `backend/` FastAPI API server
- `frontend/` React placeholder

## Start backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## API quick check
```bash
curl http://127.0.0.1:8000/health
```
