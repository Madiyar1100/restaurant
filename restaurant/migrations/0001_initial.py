from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="MenuItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=160, verbose_name="Название")),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("sets", "Сеты"),
                            ("sushi", "Суши"),
                            ("rolls", "Роллы"),
                            ("drinks", "Саке"),
                            ("sides", "Гарниры"),
                            ("sauces", "Соусы"),
                        ],
                        default="rolls",
                        max_length=24,
                        verbose_name="Категория",
                    ),
                ),
                ("price", models.PositiveIntegerField(default=0, verbose_name="Цена, ₸")),
                ("description", models.TextField(blank=True, verbose_name="Описание")),
                ("tags", models.JSONField(blank=True, default=list, verbose_name="Теги")),
                ("image_url", models.URLField(blank=True, verbose_name="Фото")),
                ("available", models.BooleanField(default=True, verbose_name="Доступно")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Создано")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Обновлено")),
            ],
            options={"verbose_name": "Позиция меню", "verbose_name_plural": "Меню", "ordering": ["category", "name"]},
        ),
        migrations.CreateModel(
            name="ChatThread",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("guest_name", models.CharField(blank=True, max_length=160, verbose_name="Имя гостя")),
                (
                    "status",
                    models.CharField(
                        choices=[("open", "Открыт"), ("waiting", "Ждет оператора"), ("closed", "Закрыт")],
                        default="waiting",
                        max_length=24,
                        verbose_name="Статус",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Создан")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Обновлен")),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Пользователь",
                    ),
                ),
            ],
            options={"verbose_name": "Диалог с оператором", "verbose_name_plural": "Диалоги с оператором", "ordering": ["-updated_at"]},
        ),
        migrations.CreateModel(
            name="CustomerProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("phone", models.CharField(blank=True, max_length=64, verbose_name="Телефон")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Создан")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Обновлен")),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="customer_profile",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"verbose_name": "Профиль гостя", "verbose_name_plural": "Профили гостей"},
        ),
        migrations.CreateModel(
            name="DeliveryOrder",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=160, verbose_name="Имя")),
                ("phone", models.CharField(max_length=64, verbose_name="Телефон")),
                ("address", models.CharField(max_length=280, verbose_name="Адрес")),
                ("time_window", models.CharField(default="asap", max_length=80, verbose_name="Время доставки")),
                (
                    "payment",
                    models.CharField(
                        choices=[("card", "Картой курьеру"), ("cash", "Наличными"), ("online", "Онлайн")],
                        default="card",
                        max_length=24,
                        verbose_name="Оплата",
                    ),
                ),
                ("notes", models.TextField(blank=True, verbose_name="Комментарий")),
                ("total", models.PositiveIntegerField(default=0, verbose_name="Итого, ₸")),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("new", "Новый"),
                            ("cooking", "Готовится"),
                            ("courier", "У курьера"),
                            ("delivered", "Доставлен"),
                            ("cancelled", "Отменен"),
                        ],
                        default="new",
                        max_length=24,
                        verbose_name="Статус",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Создан")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Обновлен")),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Пользователь",
                    ),
                ),
            ],
            options={"verbose_name": "Заказ доставки", "verbose_name_plural": "Заказы доставки", "ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="Reservation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=160, verbose_name="Имя")),
                ("phone", models.CharField(max_length=64, verbose_name="Телефон")),
                ("date", models.DateField(verbose_name="Дата")),
                ("time", models.TimeField(verbose_name="Время")),
                ("guests", models.PositiveSmallIntegerField(default=2, verbose_name="Гостей")),
                ("occasion", models.CharField(blank=True, max_length=180, verbose_name="Повод")),
                ("notes", models.TextField(blank=True, verbose_name="Пожелания")),
                (
                    "status",
                    models.CharField(
                        choices=[("new", "Новая"), ("confirmed", "Подтверждена"), ("seated", "Гости пришли"), ("cancelled", "Отменена")],
                        default="new",
                        max_length=24,
                        verbose_name="Статус",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Создана")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Обновлена")),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Пользователь",
                    ),
                ),
            ],
            options={"verbose_name": "Бронь столика", "verbose_name_plural": "Брони столиков", "ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="ChatMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "sender",
                    models.CharField(
                        choices=[("user", "Пользователь"), ("admin", "Администратор"), ("ai", "AI"), ("system", "Система")],
                        default="admin",
                        max_length=24,
                        verbose_name="Отправитель",
                    ),
                ),
                ("text", models.TextField(verbose_name="Сообщение")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Создано")),
                (
                    "author",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Автор",
                    ),
                ),
                (
                    "thread",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="messages",
                        to="restaurant.chatthread",
                        verbose_name="Диалог",
                    ),
                ),
            ],
            options={"verbose_name": "Сообщение чата", "verbose_name_plural": "Сообщения чата", "ordering": ["created_at"]},
        ),
        migrations.CreateModel(
            name="DeliveryItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=160, verbose_name="Название")),
                ("price", models.PositiveIntegerField(default=0, verbose_name="Цена, ₸")),
                ("quantity", models.PositiveSmallIntegerField(default=1, verbose_name="Количество")),
                (
                    "menu_item",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="restaurant.menuitem",
                        verbose_name="Позиция меню",
                    ),
                ),
                (
                    "order",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="items",
                        to="restaurant.deliveryorder",
                        verbose_name="Заказ",
                    ),
                ),
            ],
            options={"verbose_name": "Позиция доставки", "verbose_name_plural": "Позиции доставки"},
        ),
    ]
