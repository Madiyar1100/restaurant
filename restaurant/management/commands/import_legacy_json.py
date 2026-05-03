import json
from pathlib import Path

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from restaurant.models import CustomerProfile, DeliveryItem, DeliveryOrder, MenuItem, Reservation


class Command(BaseCommand):
    help = "Import legacy data/db.json from the previous Node version into Django models."

    def add_arguments(self, parser):
        parser.add_argument("--path", default="data/db.json")

    @transaction.atomic
    def handle(self, *args, **options):
        path = Path(options["path"])
        if not path.exists():
            self.stderr.write(f"File not found: {path}")
            return

        db = json.loads(path.read_text(encoding="utf-8"))
        users_by_legacy_id = {}
        menu_by_legacy_id = {}

        for row in db.get("users", []):
            if row.get("role") == "admin":
                continue
            email = str(row.get("email", "")).lower().strip()
            if not email:
                continue
            user, _ = User.objects.get_or_create(username=email, defaults={"email": email})
            user.email = email
            name = str(row.get("name", "")).strip()
            first_name, _, last_name = name.partition(" ")
            user.first_name = first_name
            user.last_name = last_name
            if not user.has_usable_password():
                user.set_unusable_password()
            user.save()
            profile, _ = CustomerProfile.objects.get_or_create(user=user)
            profile.phone = str(row.get("phone", "")).strip()
            profile.save()
            users_by_legacy_id[row.get("id")] = user

        for row in db.get("menu", []):
            item, _ = MenuItem.objects.get_or_create(name=row.get("name", ""), defaults={"category": row.get("category", "rolls")})
            item.category = row.get("category", "rolls")
            item.price = int(row.get("price") or 0)
            item.description = row.get("description", "")
            item.tags = row.get("tags") if isinstance(row.get("tags"), list) else []
            item.available = bool(row.get("available", True))
            item.save()
            menu_by_legacy_id[row.get("id")] = item

        for row in db.get("reservations", []):
            Reservation.objects.get_or_create(
                name=row.get("name", ""),
                phone=row.get("phone", ""),
                date=row.get("date"),
                time=row.get("time"),
                defaults={
                    "user": users_by_legacy_id.get(row.get("userId")),
                    "guests": int(row.get("guests") or 1),
                    "occasion": row.get("occasion", ""),
                    "notes": row.get("notes", ""),
                    "status": row.get("status", "new"),
                },
            )

        for row in db.get("deliveries", []):
            order, created = DeliveryOrder.objects.get_or_create(
                name=row.get("name", ""),
                phone=row.get("phone", ""),
                address=row.get("address", ""),
                defaults={
                    "user": users_by_legacy_id.get(row.get("userId")),
                    "time_window": row.get("timeWindow", "asap"),
                    "payment": row.get("payment", "card"),
                    "notes": row.get("notes", ""),
                    "status": row.get("status", "new"),
                    "total": int(row.get("total") or 0),
                },
            )
            if not created:
                continue
            total = 0
            for item in row.get("items", []):
                menu_item = menu_by_legacy_id.get(item.get("menuItemId"))
                price = int(item.get("price") or getattr(menu_item, "price", 0) or 0)
                quantity = int(item.get("quantity") or 1)
                DeliveryItem.objects.create(
                    order=order,
                    menu_item=menu_item,
                    name=item.get("name") or getattr(menu_item, "name", "Позиция"),
                    price=price,
                    quantity=quantity,
                )
                total += price * quantity
            order.total = total or order.total
            order.save(update_fields=["total"])

        self.stdout.write(self.style.SUCCESS("Legacy JSON import finished."))
