# Инструкция для Codex: коммит и публикация проектов

Короткий контекст для нового чата Codex, если нужно продолжить работу с этой общей папкой.

## Репозиторий

- Локальная папка: `/Users/i-pavel/Documents/Сервисы и Сайты`
- GitHub: `https://github.com/kondraschooov-beep/seo_service`
- Основная ветка: `main`
- Remote: `origin`
- GitHub CLI уже авторизован через аккаунт `kondraschooov-beep`.

## Что лежит внутри

- `Сервис МАЯК/` - сервис RankView/МАЯК.
- `My site/` - персональный сайт.
- `backend/`, `frontend/` - старые/общие части проекта.
- `price_2026-01-01.pdf` - сохраненный PDF-файл.

## Как коммитить

1. Перейти в репозиторий:

   ```bash
   cd "/Users/i-pavel/Documents/Сервисы и Сайты"
   ```

2. Проверить статус:

   ```bash
   git status --short --branch
   ```

3. Перед коммитом проверить, что случайно не попали приватные или тяжелые файлы:

   ```bash
   git status --short
   git diff --stat
   git diff --cached --stat
   ```

4. Если менялся проект `Сервис МАЯК/`, проверить:

   ```bash
   cd "Сервис МАЯК"
   npm run lint
   npm run build
   npm audit --audit-level=high
   ```

5. Если менялся проект `My site/`, проверить:

   ```bash
   cd "My site"
   npm run lint
   npm run build
   npm audit --audit-level=high
   ```

6. Вернуться в корень, добавить только нужные файлы, сделать коммит и push:

   ```bash
   cd "/Users/i-pavel/Documents/Сервисы и Сайты"
   git add <нужные файлы>
   git commit -m "Короткое описание изменения"
   git push
   ```

## Что нельзя коммитить

Не добавлять в git:

- `.env`, `.env.local`, `.env.production` и любые реальные секреты;
- API-ключи, токены, пароли, cookie, приватные SSH-ключи;
- `node_modules/`, `.next/`, `dist/`, `build/`, `out/`;
- ZIP/RAR/7z архивы исходников;
- `.claude/`, `CLAUDE.md`, временные файлы AI-инструментов;
- `.DS_Store`, логи, кеши, `*.tsbuildinfo`;
- реальные базы данных и дампы, если пользователь явно не попросил.

## Минимальная проверка безопасности

Перед коммитом искать явные секреты:

```bash
rg -n --hidden -S "(API_KEY|SECRET|TOKEN|PASSWORD|PRIVATE KEY|BEGIN RSA|BEGIN OPENSSH|sk-|ghp_|github_pat_|xoxb-|ya29\\.)" .
```

Если команда находит срабатывания, сначала проверить каждое место вручную. Файлы-примеры вроде `.env.example` можно коммитить только без реальных значений.

## Текущие особенности

- В обоих Next.js проектах `npm audit --audit-level=high` проходил успешно.
- Может показываться умеренная уязвимость `postcss` через `next`; high/critical на момент проверки не было.
- Папка с русским названием может содержать составную букву `й`, поэтому безопаснее заходить через маску:

  ```bash
  cd /Users/i-pavel/Documents/Сервисы*
  ```
