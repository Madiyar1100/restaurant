from django.core.management.base import BaseCommand

from restaurant.models import MenuItem


MENU = [
    {
        "name": "Omakase Set",
        "category": "sets",
        "price": 18900,
        "description": "12 нигири, 8 роллов, мисо-бульон, гари, васаби и три фирменных соуса.",
        "tags": ["шеф", "премиум"],
        "image_url": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=700&q=80",
    },
    {
        "name": "Akami Nigiri",
        "category": "sushi",
        "price": 2100,
        "description": "Постный тунец на теплом рисе с легкой кистью никири-соуса.",
        "tags": ["тунец", "классика"],
        "image_url": "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=700&q=80",
    },
    {
        "name": "Salmon Yuzu Roll",
        "category": "rolls",
        "price": 4200,
        "description": "Лосось, огурец, авокадо, юдзу-косе, кунжут и тобико.",
        "tags": ["лосось", "цитрус"],
        "image_url": "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=700&q=80",
    },
    {
        "name": "Unagi Dragon Roll",
        "category": "rolls",
        "price": 5200,
        "description": "Угорь на гриле, авокадо, огурец, глазурь таре и хрустящий рис.",
        "tags": ["угорь", "теплый"],
        "image_url": "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=700&q=80",
    },
    {
        "name": "Sake Junmai",
        "category": "drinks",
        "price": 3900,
        "description": "Сухое саке джунмай, подаем охлажденным или теплым, 180 мл.",
        "tags": ["саке", "сухое"],
        "image_url": "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=700&q=80",
    },
    {
        "name": "Edamame Shio",
        "category": "sides",
        "price": 1600,
        "description": "Эдамаме на пару с морской солью и цитрусовой цедрой.",
        "tags": ["гарнир", "вегетарианское"],
        "image_url": "https://images.unsplash.com/photo-1626201850122-a8fcb16665e1?auto=format&fit=crop&w=700&q=80",
    },
    {
        "name": "Sauce Flight",
        "category": "sauces",
        "price": 1200,
        "description": "Понзу, спайси-майо, никири-соя и копченый кунжутный соус.",
        "tags": ["соусы", "дегустация"],
        "image_url": "https://images.unsplash.com/photo-1604908554027-111cf6cf45d2?auto=format&fit=crop&w=700&q=80",
    },
    {
        "name": "Wasabi & Gari Set",
        "category": "sides",
        "price": 900,
        "description": "Свежий васаби, маринованный имбирь и соевый соус к суши-сетам.",
        "tags": ["пейринг", "классика"],
        "image_url": "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=700&q=80",
    },
]


class Command(BaseCommand):
    help = "Create the starter Sakura Table menu."

    def handle(self, *args, **options):
        created = 0
        for row in MENU:
            _, was_created = MenuItem.objects.get_or_create(
                name=row["name"],
                defaults={**row, "available": True},
            )
            created += int(was_created)
        self.stdout.write(self.style.SUCCESS(f"Seeded menu. Created: {created}"))
