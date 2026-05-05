from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.models import User

from .models import (
    ChatMessage,
    ChatThread,
    CustomerProfile,
    DeliveryItem,
    DeliveryOrder,
    MenuItem,
    Reservation,
    normalize_tags,
)


class CustomerProfileInline(admin.StackedInline):
    model = CustomerProfile
    can_delete = False
    extra = 0


class UserAdmin(DjangoUserAdmin):
    inlines = [CustomerProfileInline]
    list_display = ("username", "email", "first_name", "last_name", "is_staff", "is_active")
    search_fields = ("username", "email", "first_name", "last_name", "customer_profile__phone")


admin.site.unregister(User)
admin.site.register(User, UserAdmin)


class MenuItemAdminForm(forms.ModelForm):
    tags = forms.CharField(
        label="Теги",
        required=False,
        help_text="Пишите через запятую: лосось, острый, теплый. Можно оставить пустым.",
    )

    class Meta:
        model = MenuItem
        fields = ("name", "category", "price", "description", "tags", "image_url", "available")
        help_texts = {
            "image_url": "Вставьте прямую https-ссылку именно на файл картинки для этого блюда. Две позиции из одной категории могут иметь разные фото. Не страницу Unsplash вида /photos/..., а Copy image address, обычно images.unsplash.com/... Если оставить пустым, сайт покажет стандартную картинку категории.",
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            self.fields["tags"].initial = ", ".join(normalize_tags(self.instance.tags))

    def clean_tags(self):
        return normalize_tags(self.cleaned_data.get("tags"))


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    form = MenuItemAdminForm
    list_display = ("name", "category", "price", "available", "updated_at")
    list_filter = ("category", "available")
    search_fields = ("name", "description")


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "date", "time", "guests", "status", "created_at")
    list_filter = ("status", "date")
    search_fields = ("name", "phone", "occasion", "notes", "user__email")
    list_editable = ("status",)
    date_hierarchy = "date"


class DeliveryItemInline(admin.TabularInline):
    model = DeliveryItem
    extra = 0
    readonly_fields = ("subtotal",)


@admin.register(DeliveryOrder)
class DeliveryOrderAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "address", "total", "promo_code", "discount_amount", "payment", "status", "created_at")
    list_filter = ("status", "payment", "promo_code", "created_at")
    search_fields = ("name", "phone", "address", "notes", "payment_details", "promo_code", "user__email")
    list_editable = ("status",)
    fieldsets = (
        ("Клиент", {"fields": ("user", "name", "phone", "address")}),
        ("Оплата и доставка", {"fields": ("time_window", "payment", "payment_details", "promo_code", "discount_percent", "discount_amount", "total", "status")}),
        ("Комментарий", {"fields": ("notes",)}),
    )
    inlines = [DeliveryItemInline]


class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 1
    fields = ("sender", "author", "text", "created_at")
    readonly_fields = ("created_at",)

    def get_changeform_initial_data(self, request):
        return {"sender": ChatMessage.Sender.ADMIN, "author": request.user}


@admin.register(ChatThread)
class ChatThreadAdmin(admin.ModelAdmin):
    list_display = ("id", "guest_name", "user", "status", "updated_at")
    list_filter = ("status", "updated_at")
    search_fields = ("guest_name", "user__email", "messages__text")
    list_editable = ("status",)
    inlines = [ChatMessageInline]

    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for obj in instances:
            if isinstance(obj, ChatMessage) and not obj.author_id and obj.sender == ChatMessage.Sender.ADMIN:
                obj.author = request.user
            obj.save()
            if isinstance(obj, ChatMessage) and obj.sender == ChatMessage.Sender.ADMIN:
                obj.thread.status = ChatThread.Status.OPEN
                obj.thread.save(update_fields=["status", "updated_at"])
        formset.save_m2m()


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ("thread", "sender", "author", "short_text", "created_at")
    list_filter = ("sender", "created_at")
    search_fields = ("text", "thread__guest_name", "thread__user__email")

    def short_text(self, obj):
        return obj.text[:80]

    short_text.short_description = "Сообщение"
