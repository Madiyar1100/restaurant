from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("restaurant", "0003_customerprofile_avatar_url"),
    ]

    operations = [
        migrations.AddField(
            model_name="deliveryorder",
            name="promo_code",
            field=models.CharField(blank=True, max_length=40, verbose_name="Промокод"),
        ),
        migrations.AddField(
            model_name="deliveryorder",
            name="discount_percent",
            field=models.PositiveSmallIntegerField(default=0, verbose_name="Скидка, %"),
        ),
        migrations.AddField(
            model_name="deliveryorder",
            name="discount_amount",
            field=models.PositiveIntegerField(default=0, verbose_name="Сумма скидки, ₸"),
        ),
    ]
