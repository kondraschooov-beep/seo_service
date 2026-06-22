# Деплой на VPS Timeweb (Ubuntu 22.04/24.04)

Ориентир: самый дешёвый VPS (1 CPU / 1–2 ГБ RAM) тянет сервис с запасом.
Везде ниже замените `seo.example.ru` на свой домен.

## 0. DNS

В панели Timeweb (или у регистратора) создайте A-запись домена/поддомена на IP вашего VPS. Дальше подождите, пока запись разойдётся (`ping seo.example.ru` должен показывать IP сервера).

## 1. Подготовка сервера (один раз, под root)

```bash
apt update && apt upgrade -y
apt install -y nginx git curl build-essential

# Node.js 22 LTS из NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# отдельный пользователь без sudo — под ним будет жить сервис
adduser --system --group --home /var/www/mayak mayak
```

## 2. Код на сервер

Вариант А — git (рекомендуется): запушьте папку проекта в свой репозиторий и:

```bash
cd /var/www/mayak
sudo -u mayak git clone <ваш-репозиторий> app
```

Вариант Б — без git: с локальной машины загрузите код (без `node_modules`, `.next` и `data`):

```bash
rsync -av --exclude node_modules --exclude .next --exclude data \
  "/Users/i-pavel/Cursor test/searchlight/" root@SERVER_IP:/var/www/mayak/app/
ssh root@SERVER_IP chown -R mayak:mayak /var/www/mayak
```

## 3. Конфигурация и сборка

```bash
cd /var/www/mayak/app
sudo -u mayak cp .env.example .env
sudo -u mayak nano .env
```

В `.env` пропишите:
- `APP_URL` — публичный адрес сервиса, например `https://seo.example.ru` (без слэша в конце). **Обязательно** — иначе OAuth-кнопки будут редиректить на `localhost`;
- `AUTH_SECRET` — случайная строка: сгенерируйте `openssl rand -base64 48`;
- `YANDEX_CLIENT_ID/SECRET`, `GOOGLE_CLIENT_ID/SECRET` — ключи приложений.
  В настройках приложений добавьте продовые Redirect URI:
  `https://seo.example.ru/api/oauth/yandex/callback` и `https://seo.example.ru/api/oauth/google/callback`.

```bash
sudo -u mayak npm ci   # или npm install, если нет package-lock
sudo -u mayak npm run build
```

## 4. systemd — автозапуск

```bash
cp deploy/searchlight.service /etc/systemd/system/mayak.service
# юнит рассчитан на код в /var/www/mayak/app — если путь другой, поправьте WorkingDirectory
systemctl daemon-reload
systemctl enable --now mayak
systemctl status mayak   # должно быть active (running)
```

## 5. nginx + HTTPS

```bash
cp deploy/nginx.conf /etc/nginx/sites-available/mayak
nano /etc/nginx/sites-available/mayak   # вписать свой домен
ln -s /etc/nginx/sites-available/mayak /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# бесплатный сертификат Let's Encrypt
apt install -y certbot python3-certbot-nginx
certbot --nginx -d seo.example.ru
```

Certbot сам перепишет конфиг на HTTPS и настроит продление. После этого OAuth-кнопки заработают (Google требует HTTPS).

## 6. Проверка

- `https://seo.example.ru` → страница входа, регистрируете аккаунт;
- создаёте проект, в настройках жмёте «Войти через Яндекс» / «Войти через Google»;
- база появится в `/var/www/mayak/app/data/searchlight.db`.

## Обновление версии

```bash
cd /var/www/mayak/app
sudo -u mayak git pull          # или rsync новых файлов (НЕ трогая папку data/)
sudo -u mayak npm ci
sudo -u mayak npm run build
systemctl restart mayak
```

## Бэкап

Вся пользовательская информация — один файл. В cron, например, раз в сутки:

```bash
sqlite3 /var/www/mayak/app/data/searchlight.db ".backup /var/backups/mayak-$(date +%F).db"
```

(`apt install sqlite3`; .backup безопасен при работающем сервисе благодаря WAL.)

## Если что-то не так

- `journalctl -u mayak -f` — логи приложения;
- `nginx -t` и `/var/log/nginx/error.log` — прокси;
- 502 — сервис не слушает 3000: `systemctl status mayak`;
- OAuth `redirect_uri_mismatch` — адрес callback в приложении Яндекса/Google не совпадает с доменом (протокол и слэши важны).

### OAuth ведёт на localhost или «Не заданы YANDEX_CLIENT_ID…»

Две частые причины:

1. **Редирект на `localhost:3000`** — не задан `APP_URL`. Пропишите в `.env`
   `APP_URL=https://ваш-домен` (без слэша в конце) и перезапустите: `systemctl restart mayak`.

2. **«Не заданы …CLIENT_ID/SECRET в .env»** — приложение не видит переменные. Проверьте по шагам:
   ```bash
   cd /var/www/mayak/app
   ls -la .env                    # файл должен существовать именно здесь (cwd сервиса)
   cat .env                       # значения заполнены, без кавычек и лишних пробелов
   sudo -u mayak cat .env         # пользователь mayak имеет право читать файл
   systemctl restart mayak        # ОБЯЗАТЕЛЬНО перезапустить после правки .env
   ```
   Next.js читает `.env` из рабочей директории (`WorkingDirectory` в юните = `/var/www/mayak/app`).
   Если файл называется `.env.example` — переименуйте в `.env`. Менять код для этого не нужно.

После исправления в приложениях Яндекса и Google в списке Redirect URI должны быть именно
`https://ваш-домен/api/oauth/yandex/callback` и `.../google/callback` — ровно как в `APP_URL`.
