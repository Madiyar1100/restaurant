import os

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create or update a Django superuser from ADMIN_* environment variables."

    def handle(self, *args, **options):
        username = os.environ.get("ADMIN_USERNAME")
        password = os.environ.get("ADMIN_PASSWORD")
        email = os.environ.get("ADMIN_EMAIL", username or "")

        if not username or not password:
            self.stdout.write("ADMIN_USERNAME or ADMIN_PASSWORD is empty; superuser was not changed.")
            return

        user, _ = User.objects.get_or_create(username=username, defaults={"email": email})
        user.email = email
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save()
        self.stdout.write(self.style.SUCCESS(f"Superuser is ready: {username}"))
