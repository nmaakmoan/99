# Online Shop

Full-stack интернет-магазин на Django REST Framework и React + TypeScript.

## Возможности
- Регистрация, вход и JWT-аутентификация.
- Категории и каталог товаров.
- Поиск по названию и фильтр по категории.
- Страница товара.
- Корзина: добавление, изменение количества и удаление.
- Оформление заказа и история заказов.
- Профиль пользователя.
- Django Admin.
- REST API.

## Стек
**Backend:** Python, Django, Django REST Framework, SimpleJWT, PostgreSQL, django-cors-headers, python-dotenv.  
**Frontend:** React, TypeScript, Vite, Axios, React Router.

## Требования
Python 3.10+, Node.js 20+, PostgreSQL 14+.

## Запуск backend
1. Создайте базу PostgreSQL `online_shop`.
2. Перейдите в `backend`.
3. Создайте и активируйте виртуальное окружение:
   ```bash
   python -m venv venv
   # Windows PowerShell
   .\venv\Scripts\Activate
   # macOS/Linux
   source venv/bin/activate
   ```
4. Установите зависимости:
   ```bash
   pip install -r requirements.txt
   ```
5. Скопируйте `.env.example` в `backend/.env` и заполните параметры PostgreSQL.
6. Выполните миграции и создайте администратора:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py runserver
   ```

Backend: http://127.0.0.1:8000  
Админка: http://127.0.0.1:8000/admin/

## Запуск frontend
В другом терминале:
```bash
cd frontend
npm install
```
Создайте `frontend/.env` и задайте:
```env
VITE_API_URL=http://127.0.0.1:8000/api
```
Запустите:
```bash
npm run dev
```
Frontend: http://localhost:5173

## Основные API endpoints
| Метод | Endpoint | Назначение | Доступ |
|---|---|---|---|
| POST | `/api/auth/register/` | Регистрация | Публичный |
| POST | `/api/auth/token/` | Получение JWT | Публичный |
| POST | `/api/auth/token/refresh/` | Обновление JWT | Публичный |
| GET | `/api/categories/` | Категории | Публичный |
| GET | `/api/products/` | Каталог, `?search=`, `?category=` | Публичный |
| GET | `/api/products/<id>/` | Детали товара | Публичный |
| GET/POST | `/api/cart/` | Просмотр/добавление в корзину | Авторизованный |
| PATCH/DELETE | `/api/cart/<id>/` | Изменение/удаление позиции | Авторизованный |
| POST | `/api/orders/` | Оформление заказа | Авторизованный |
| GET | `/api/orders/` | История заказов | Авторизованный |
| GET/PATCH | `/api/profile/` | Профиль | Авторизованный |

## Структура
```text
online-shop/
├── backend/
│   ├── config/
│   ├── shop/
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── screenshots/
├── .env.example
└── README.md
```

## Screenshots
Добавьте скриншоты главной страницы, каталога, карточки товара, корзины и личного кабинета в `screenshots/`.

## Использование AI
При подготовке проекта использовался ChatGPT для генерации и доработки части исходного кода и документации. Перед сдачей проверьте и адаптируйте код, убедитесь, что понимаете его работу.
