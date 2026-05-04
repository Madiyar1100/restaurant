from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("restaurant", "0002_deliveryorder_payment_details"),
    ]

    operations = [
        migrations.AddField(
            model_name="customerprofile",
            name="avatar_url",
            field=models.TextField(blank=True, verbose_name="Фото профиля"),
        ),
    ]
