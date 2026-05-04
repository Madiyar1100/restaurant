from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("restaurant", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="deliveryorder",
            name="payment_details",
            field=models.TextField(blank=True, verbose_name="Данные оплаты"),
        ),
    ]
