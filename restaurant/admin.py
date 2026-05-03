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


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "available", "updated_at")
    list_filter = ("category", "available")
    search_fields = ("name", "description")
    list_editable = ("price", "available")


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
    list_display = ("name", "phone", "address", "total", "payment", "status", "created_at")
    list_filter = ("status", "payment", "created_at")
    search_fields = ("name", "phone", "address", "notes", "user__email")
    list_editable = ("status",)
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
