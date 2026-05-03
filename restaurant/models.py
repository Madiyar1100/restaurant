from django.conf import settings
from django.db import models


class CustomerProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="customer_profile")
    phone = models.CharField("Телефон", max_length=64, blank=True)
    created_at = models.DateTimeField("Создан", auto_now_add=True)
    updated_at = models.DateTimeField("Обновлен", auto_now=True)

    class Meta:
        verbose_name = "Профиль гостя"
        verbose_name_plural = "Профили гостей"

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.email} ({self.phone or 'без телефона'})"


class MenuItem(models.Model):
    class Category(models.TextChoices):
        SETS = "sets", "Сеты"
        SUSHI = "sushi", "Суши"
        ROLLS = "rolls", "Роллы"
        DRINKS = "drinks", "Саке"
        SIDES = "sides", "Гарниры"
        SAUCES = "sauces", "Соусы"

    name = models.CharField("Название", max_length=160)
    category = models.CharField("Категория", max_length=24, choices=Category.choices, default=Category.ROLLS)
    price = models.PositiveIntegerField("Цена, ₸", default=0)
    description = models.TextField("Описание", blank=True)
    tags = models.JSONField("Теги", default=list, blank=True)
    image_url = models.URLField("Фото", blank=True)
    available = models.BooleanField("Доступно", default=True)
    created_at = models.DateTimeField("Создано", auto_now_add=True)
    updated_at = models.DateTimeField("Обновлено", auto_now=True)

    class Meta:
        verbose_name = "Позиция меню"
        verbose_name_plural = "Меню"
        ordering = ["category", "name"]

    def __str__(self):
        return self.name


class Reservation(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "Новая"
        CONFIRMED = "confirmed", "Подтверждена"
        SEATED = "seated", "Гости пришли"
        CANCELLED = "cancelled", "Отменена"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Пользователь")
    name = models.CharField("Имя", max_length=160)
    phone = models.CharField("Телефон", max_length=64)
    date = models.DateField("Дата")
    time = models.TimeField("Время")
    guests = models.PositiveSmallIntegerField("Гостей", default=2)
    occasion = models.CharField("Повод", max_length=180, blank=True)
    notes = models.TextField("Пожелания", blank=True)
    status = models.CharField("Статус", max_length=24, choices=Status.choices, default=Status.NEW)
    created_at = models.DateTimeField("Создана", auto_now_add=True)
    updated_at = models.DateTimeField("Обновлена", auto_now=True)

    class Meta:
        verbose_name = "Бронь столика"
        verbose_name_plural = "Брони столиков"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name}, {self.date} {self.time}, {self.guests} гостей"


class DeliveryOrder(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "Новый"
        COOKING = "cooking", "Готовится"
        COURIER = "courier", "У курьера"
        DELIVERED = "delivered", "Доставлен"
        CANCELLED = "cancelled", "Отменен"

    class Payment(models.TextChoices):
        CARD = "card", "Картой курьеру"
        CASH = "cash", "Наличными"
        ONLINE = "online", "Онлайн"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Пользователь")
    name = models.CharField("Имя", max_length=160)
    phone = models.CharField("Телефон", max_length=64)
    address = models.CharField("Адрес", max_length=280)
    time_window = models.CharField("Время доставки", max_length=80, default="asap")
    payment = models.CharField("Оплата", max_length=24, choices=Payment.choices, default=Payment.CARD)
    notes = models.TextField("Комментарий", blank=True)
    total = models.PositiveIntegerField("Итого, ₸", default=0)
    status = models.CharField("Статус", max_length=24, choices=Status.choices, default=Status.NEW)
    created_at = models.DateTimeField("Создан", auto_now_add=True)
    updated_at = models.DateTimeField("Обновлен", auto_now=True)

    class Meta:
        verbose_name = "Заказ доставки"
        verbose_name_plural = "Заказы доставки"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name}, {self.total} ₸, {self.get_status_display()}"


class DeliveryItem(models.Model):
    order = models.ForeignKey(DeliveryOrder, on_delete=models.CASCADE, related_name="items", verbose_name="Заказ")
    menu_item = models.ForeignKey(MenuItem, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Позиция меню")
    name = models.CharField("Название", max_length=160)
    price = models.PositiveIntegerField("Цена, ₸", default=0)
    quantity = models.PositiveSmallIntegerField("Количество", default=1)

    class Meta:
        verbose_name = "Позиция доставки"
        verbose_name_plural = "Позиции доставки"

    @property
    def subtotal(self):
        return self.price * self.quantity

    def __str__(self):
        return f"{self.name} x{self.quantity}"


class ChatThread(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Открыт"
        WAITING = "waiting", "Ждет оператора"
        CLOSED = "closed", "Закрыт"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Пользователь")
    guest_name = models.CharField("Имя гостя", max_length=160, blank=True)
    status = models.CharField("Статус", max_length=24, choices=Status.choices, default=Status.WAITING)
    created_at = models.DateTimeField("Создан", auto_now_add=True)
    updated_at = models.DateTimeField("Обновлен", auto_now=True)

    class Meta:
        verbose_name = "Диалог с оператором"
        verbose_name_plural = "Диалоги с оператором"
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Чат #{self.pk} - {self.guest_name or self.user or 'гость'}"


class ChatMessage(models.Model):
    class Sender(models.TextChoices):
        USER = "user", "Пользователь"
        ADMIN = "admin", "Администратор"
        AI = "ai", "AI"
        SYSTEM = "system", "Система"

    thread = models.ForeignKey(ChatThread, on_delete=models.CASCADE, related_name="messages", verbose_name="Диалог")
    sender = models.CharField("Отправитель", max_length=24, choices=Sender.choices, default=Sender.ADMIN)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Автор")
    text = models.TextField("Сообщение")
    created_at = models.DateTimeField("Создано", auto_now_add=True)

    class Meta:
        verbose_name = "Сообщение чата"
        verbose_name_plural = "Сообщения чата"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.get_sender_display()}: {self.text[:60]}"
