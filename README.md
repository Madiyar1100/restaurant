.\.venv\Scripts\python manage.py runserver 0.0.0.0:8000

# Sakura Table

Django-сайт ресторана суши с регистрацией гостей, бронированием столиков, доставкой, AI-чатом и живым оператором через Django Admin.

## Что работает

- Главная витрина, меню, корзина, бронь, доставка, профиль гостя.
- Регистрация с правилом пароля: минимум 8 символов и хотя бы один спецсимвол.
- Генератор пароля и кнопка показа/скрытия пароля.
- Светлая и темная тема.
- AI-чат через Groq API на backend.
- Голосовой ввод в чат через Web Speech API браузера.
- Кнопка вызова оператора в чате.
- Ответ оператора через Django Admin в модели `Диалоги с оператором`.
- Django Admin для пользователей, профилей, меню, броней, доставок и сообщений чата.
- PostgreSQL через `DATABASE_URL` на Render/Beget Cloud и SQLite локально без `DATABASE_URL`.

## Структура

```text
restaurant_project/        Django settings, urls, wsgi/asgi
restaurant/                модели, API, admin, management-команды
public/                    HTML/CSS/JS витрины
requirements.txt           Python зависимости
build.sh                   build для Render
render.yaml                Render Blueprint
Procfile                   gunicorn start command
passenger_wsgi.py          WSGI entrypoint для Beget/Python hosting
```

`server.js` остался только как legacy-файл предыдущей Node-версии. Актуальный backend теперь Django.

## Локальный запуск

Нужен Python 3.12+.

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_sakura
python manage.py ensure_admin
python manage.py runserver 0.0.0.0:8000
```

Открыть:

```text
http://localhost:8000
```

Django Admin:

```text
http://localhost:8000/admin/
```

## Переменные окружения

Локально создан `.env` для проверки. Он игнорируется git-ом.

Пример без секретов:

```env
DEBUG=1
SECRET_KEY=change-this-django-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1,.onrender.com
CSRF_TRUSTED_ORIGINS=https://*.onrender.com
DATABASE_URL=
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
ADMIN_USERNAME=manager
ADMIN_EMAIL=manager@example.com
ADMIN_PASSWORD=change-this-admin-password
```

Для локальной проверки сейчас установлен админ:

```text
Логин: manager
Пароль: manager#2026
```

Перед публикацией поменяйте `SECRET_KEY`, `ADMIN_PASSWORD` и задайте `GROQ_API_KEY` в панели хостинга.

## Как админ отвечает пользователю в чате

1. Гость входит в аккаунт на сайте.
2. В AI-чате нажимает `Оператор`.
3. Django создает `Диалог с оператором`.
4. Админ открывает `/admin/`, заходит в `Диалоги с оператором`.
5. Внутри диалога добавляет новое сообщение с отправителем `Администратор`.
6. Frontend пользователя опрашивает API каждые 5 секунд и показывает ответ.

Это работает на хостинге, если web-сервис и Django Admin используют одну и ту же базу через `DATABASE_URL`.

## Render

Вариант 1: Blueprint.

1. Загрузите проект в GitHub/GitLab.
2. В Render Dashboard откройте Blueprints.
3. Выберите репозиторий с `render.yaml`.
4. В env задайте:
   - `GROQ_API_KEY`
   - `ADMIN_USERNAME`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
5. Render создаст web service и PostgreSQL.

Вариант 2: ручная настройка.

```text
Build Command: bash build.sh
Start Command: gunicorn restaurant_project.wsgi:application
```

Обязательные env:

```text
DATABASE_URL
SECRET_KEY
DEBUG=0
ALLOWED_HOSTS=ваш-домен.onrender.com,ваш-домен
CSRF_TRUSTED_ORIGINS=https://ваш-домен.onrender.com,https://ваш-домен
GROQ_API_KEY
ADMIN_USERNAME
ADMIN_EMAIL
ADMIN_PASSWORD
```

Build script выполняет:

```text
collectstatic
migrate
seed_sakura
ensure_admin
```

## Beget

Для Django лучше использовать Beget Cloud/VPS или тариф с Python-приложениями, SSH и WSGI. Обычный PHP/CMS-хостинг может быть неудобен для постоянного Django-процесса.

Подготовлено:

- `passenger_wsgi.py` для WSGI-точки входа;
- `requirements.txt` для установки зависимостей;
- поддержка `DATABASE_URL` для PostgreSQL;
- `STATIC_ROOT=staticfiles` и WhiteNoise для static.

Шаги на Beget Cloud/VPS:

1. Создайте Python/Django окружение или VPS с Python 3.12.
2. Создайте PostgreSQL и получите строку подключения.
3. Загрузите проект.
4. Установите зависимости: `pip install -r requirements.txt`.
5. Задайте env из раздела выше.
6. Выполните:

```bash
python manage.py collectstatic --no-input
python manage.py migrate
python manage.py seed_sakura
python manage.py ensure_admin
```

7. Запустите через WSGI/Gunicorn, в зависимости от типа услуги.

## База данных

Модели:

- `User` и `CustomerProfile` - данные зарегистрированных гостей.
- `MenuItem` - меню.
- `Reservation` - брони столиков с датой, временем, телефоном, гостями и статусом.
- `DeliveryOrder` и `DeliveryItem` - доставка с адресом, оплатой, составом заказа и суммой.
- `ChatThread` и `ChatMessage` - живой чат с оператором.

Если нужно перенести старый JSON:

```bash
python manage.py import_legacy_json --path data/db.json
```

## Проверка API

```text
GET /api/health
GET /api/menu
POST /api/register
POST /api/login
PATCH /api/me
POST /api/reservations
POST /api/deliveries
POST /api/chat
POST /api/chat/operator
GET/POST /api/chat/operator/messages
```
