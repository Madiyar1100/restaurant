import json
import re
import urllib.error
import urllib.request

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db import transaction
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import ChatMessage, ChatThread, CustomerProfile, DeliveryItem, DeliveryOrder, MenuItem, Reservation, normalize_tags


SPECIAL_RE = re.compile(r"[^A-Za-z0-9]")


def index(request):
    return render(request, "index.html")


def body_json(request):
    if not request.body:
        return {}
    try:
        return json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        raise ValueError("Некорректный JSON")


def text(value, fallback=""):
    value = fallback if value is None else value
    return str(value).strip()


def number(value, fallback=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return fallback


def strong_password(password):
    return isinstance(password, str) and len(password) >= 8 and bool(SPECIAL_RE.search(password))


def password_message():
    return "Пароль должен быть от 8 символов и содержать хотя бы один спецсимвол"


def json_error(message, status=400):
    return JsonResponse({"error": message}, status=status)


def require_user(request):
    if not request.user.is_authenticated:
        return None
    return request.user


def profile_for(user):
    profile, _ = CustomerProfile.objects.get_or_create(user=user)
    return profile


def user_payload(user):
    if not user or not user.is_authenticated:
        return None
    profile = profile_for(user)
    full_name = user.get_full_name().strip() or user.username
    return {
        "id": str(user.id),
        "name": full_name,
        "email": user.email,
        "phone": profile.phone,
        "avatarUrl": profile.avatar_url,
        "role": "admin" if user.is_staff else "guest",
        "createdAt": user.date_joined.isoformat(),
    }


def menu_payload(item):
    return {
        "id": str(item.id),
        "name": item.name,
        "category": item.category,
        "price": item.price,
        "description": item.description,
        "tags": normalize_tags(item.tags),
        "imageUrl": item.image_url,
        "available": item.available,
    }


def payment_details_from(data):
    if text(data.get("payment")) != DeliveryOrder.Payment.ONLINE:
        return ""
    rows = []
    method = text(data.get("onlineMethod"))
    method_label = {
        "transfer_phone": "Переводом на номер",
        "card_last4": "Картой, последние 4 цифры",
    }.get(method, method or "Онлайн")
    rows.append(f"Способ: {method_label}")
    if text(data.get("payerName")):
        rows.append(f"Плательщик: {text(data.get('payerName'))}")
    if text(data.get("transferPhone")):
        rows.append(f"Телефон перевода: {text(data.get('transferPhone'))}")
    if text(data.get("cardLast4")):
        digits = "".join(char for char in text(data.get("cardLast4")) if char.isdigit())[-4:]
        if digits:
            rows.append(f"Последние 4 цифры карты: {digits}")
    if text(data.get("paymentComment")):
        rows.append(f"Комментарий: {text(data.get('paymentComment'))}")
    return "\n".join(rows)


def message_payload(message):
    return {
        "id": str(message.id),
        "sender": message.sender,
        "text": message.text,
        "createdAt": message.created_at.isoformat(),
    }


@require_http_methods(["GET"])
def health(request):
    return JsonResponse(
        {
            "ok": True,
            "service": "Sakura Table Django",
            "time": timezone.now().isoformat(),
            "aiConfigured": bool(settings.GROQ_API_KEY and not settings.GROQ_API_KEY.startswith("your_")),
            "groqModel": settings.GROQ_MODEL,
        }
    )


@never_cache
@require_http_methods(["GET"])
def menu(request):
    items = MenuItem.objects.all()
    return JsonResponse({"menu": [menu_payload(item) for item in items]})


@never_cache
@require_http_methods(["GET"])
def menu_pdf(request):
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib.units import mm
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
    except ImportError:
        return json_error("PDF генератор не установлен. Проверьте dependency reportlab.", 503)

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = 'attachment; filename="sakura-menu.pdf"'

    font_name = "Helvetica"
    for font_path in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ):
        try:
            pdfmetrics.registerFont(TTFont("SakuraSans", font_path))
            font_name = "SakuraSans"
            break
        except Exception:
            continue

    doc = SimpleDocTemplate(response, pagesize=A4, rightMargin=16 * mm, leftMargin=16 * mm, topMargin=16 * mm, bottomMargin=16 * mm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("SakuraTitle", parent=styles["Title"], fontName=font_name, fontSize=24, leading=30, textColor=colors.HexColor("#a91f2a"))
    section_style = ParagraphStyle("SakuraSection", parent=styles["Heading2"], fontName=font_name, fontSize=14, leading=18, spaceBefore=12)
    text_style = ParagraphStyle("SakuraText", parent=styles["BodyText"], fontName=font_name, fontSize=9, leading=12)
    story = [Paragraph("Sakura Table - меню", title_style), Spacer(1, 8 * mm)]

    categories = dict(MenuItem.Category.choices)
    for category, label in categories.items():
        items = MenuItem.objects.filter(category=category, available=True).order_by("name")
        if not items.exists():
            continue
        story.append(Paragraph(label, section_style))
        data = [["Блюдо", "Описание", "Цена"]]
        for item in items:
            data.append([
                Paragraph(item.name, text_style),
                Paragraph(item.description or "", text_style),
                Paragraph(f"{item.price} ₸", text_style),
            ])
        table = Table(data, colWidths=[42 * mm, 92 * mm, 28 * mm])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#a91f2a")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, -1), font_name),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#d7c7ae")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#fff8eb"), colors.HexColor("#f4ead8")]),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        story.append(table)
        story.append(Spacer(1, 4 * mm))

    doc.build(story)
    return response


@csrf_exempt
@require_http_methods(["GET", "PATCH"])
def me(request):
    user = require_user(request)
    if not user:
        return JsonResponse({"user": None}) if request.method == "GET" else json_error("Нужно войти в аккаунт", 401)

    if request.method == "GET":
        return JsonResponse({"user": user_payload(user)})

    try:
        data = body_json(request)
    except ValueError as error:
        return json_error(str(error), 400)

    email = text(data.get("email"), user.email).lower()
    if email != user.email.lower() and User.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
        return json_error("Этот email уже зарегистрирован", 409)

    password = text(data.get("password"))
    if password and not strong_password(password):
        return json_error(password_message(), 400)

    name = text(data.get("name"), user.get_full_name() or user.username)
    first_name, _, last_name = name.partition(" ")
    user.username = email
    user.email = email
    user.first_name = first_name
    user.last_name = last_name
    if password:
        user.set_password(password)
    user.save()

    profile = profile_for(user)
    profile.phone = text(data.get("phone"), profile.phone)
    profile.avatar_url = text(data.get("avatarUrl"), profile.avatar_url)
    profile.save()

    if password:
        login(request, user)

    return JsonResponse({"user": user_payload(user)})


@csrf_exempt
@require_http_methods(["POST"])
def register(request):
    try:
        data = body_json(request)
    except ValueError as error:
        return json_error(str(error), 400)

    email = text(data.get("email")).lower()
    password = text(data.get("password"))
    name = text(data.get("name"))
    if not name or not email:
        return json_error("Имя и email обязательны", 400)
    if not strong_password(password):
        return json_error(password_message(), 400)
    if User.objects.filter(email__iexact=email).exists():
        return json_error("Этот email уже зарегистрирован", 409)

    first_name, _, last_name = name.partition(" ")
    user = User.objects.create_user(username=email, email=email, password=password, first_name=first_name, last_name=last_name)
    CustomerProfile.objects.create(user=user, phone=text(data.get("phone")), avatar_url=text(data.get("avatarUrl")))
    login(request, user)
    return JsonResponse({"user": user_payload(user)}, status=201)


@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    try:
        data = body_json(request)
    except ValueError as error:
        return json_error(str(error), 400)

    email = text(data.get("email")).lower()
    user = authenticate(request, username=email, password=text(data.get("password")))
    if not user:
        return json_error("Неверный email или пароль", 401)
    if user.is_staff:
        return json_error("Администратор входит через Django Admin", 403)
    login(request, user)
    return JsonResponse({"user": user_payload(user)})


@csrf_exempt
@require_http_methods(["POST"])
def logout_view(request):
    logout(request)
    return JsonResponse({"ok": True})


@csrf_exempt
@require_http_methods(["POST"])
def reservations(request):
    user = require_user(request)
    if not user:
        return json_error("Нужно войти в аккаунт", 401)
    try:
        data = body_json(request)
    except ValueError as error:
        return json_error(str(error), 400)

    if not text(data.get("date")) or not text(data.get("time")) or number(data.get("guests"), 0) < 1:
        return json_error("Дата, время и количество гостей обязательны", 400)

    reservation = Reservation.objects.create(
        user=user,
        name=text(data.get("name"), user_payload(user)["name"]),
        phone=text(data.get("phone"), user_payload(user)["phone"]),
        date=text(data.get("date")),
        time=text(data.get("time")),
        guests=max(1, number(data.get("guests"), 1)),
        occasion=text(data.get("occasion")),
        notes=text(data.get("notes")),
    )
    return JsonResponse({"reservation": {"id": str(reservation.id), "status": reservation.status}}, status=201)


@csrf_exempt
@require_http_methods(["POST"])
def deliveries(request):
    user = require_user(request)
    if not user:
        return json_error("Нужно войти в аккаунт", 401)
    try:
        data = body_json(request)
    except ValueError as error:
        return json_error(str(error), 400)

    raw_items = data.get("items") if isinstance(data.get("items"), list) else []
    normalized = []
    for row in raw_items:
        menu_item = MenuItem.objects.filter(pk=row.get("menuItemId"), available=True).first()
        if not menu_item:
            continue
        quantity = max(1, number(row.get("quantity"), 1))
        normalized.append((menu_item, quantity))

    if not normalized or not text(data.get("address")) or not text(data.get("phone")):
        return json_error("Для доставки нужны позиции, адрес и телефон", 400)

    with transaction.atomic():
        order = DeliveryOrder.objects.create(
            user=user,
            name=text(data.get("name"), user_payload(user)["name"]),
            phone=text(data.get("phone"), user_payload(user)["phone"]),
            address=text(data.get("address")),
            time_window=text(data.get("timeWindow"), "asap"),
            payment=text(data.get("payment"), DeliveryOrder.Payment.CARD),
            payment_details=payment_details_from(data),
            notes=text(data.get("notes")),
        )
        total = 0
        for menu_item, quantity in normalized:
            DeliveryItem.objects.create(
                order=order,
                menu_item=menu_item,
                name=menu_item.name,
                price=menu_item.price,
                quantity=quantity,
            )
            total += menu_item.price * quantity
        order.total = total
        order.save(update_fields=["total"])

    return JsonResponse({"delivery": {"id": str(order.id), "status": order.status, "total": order.total}}, status=201)


def restaurant_context():
    menu_lines = [
        f"{item.name}: {item.description} Цена {item.price} KZT. Категория {item.get_category_display()}."
        for item in MenuItem.objects.filter(available=True)[:18]
    ]
    return "\n".join(
        [
            "Ты AI-ассистент ресторана Sakura Table.",
            "Отвечай по-русски, кратко, вежливо и практично.",
            "Помогай с меню, суши, роллами, саке, соусами, васаби, бронированием и доставкой.",
            "Если пользователь просит живого человека, предложи нажать кнопку вызова оператора.",
            "Актуальные позиции меню:",
            "\n".join(menu_lines) or "Меню пока пустое.",
        ]
    )


def ask_groq(messages):
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY.startswith("your_"):
        raise RuntimeError("AI-чат не настроен: переменная GROQ_API_KEY пустая или оставлена примером.")

    payload = json.dumps(
        {
            "model": settings.GROQ_MODEL,
            "temperature": 0.35,
            "max_tokens": 500,
            "messages": [{"role": "system", "content": restaurant_context()}] + messages[-8:],
        }
    ).encode("utf-8")

    request = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=18) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        details = error.read().decode("utf-8", errors="ignore")
        try:
            payload = json.loads(details)
            details = payload.get("error", {}).get("message") or details
        except json.JSONDecodeError:
            pass
        if error.code in {401, 403}:
            raise RuntimeError("Groq отклонил ключ API. Удалите лишние пробелы/кавычки в GROQ_API_KEY или создайте новый ключ в Groq Console и перезапустите deploy.")
        raise RuntimeError(details or f"Groq вернул ошибку {error.code}")
    except (urllib.error.URLError, TimeoutError) as error:
        raise RuntimeError(f"Не удалось подключиться к Groq: {error}")
    return data.get("choices", [{}])[0].get("message", {}).get("content", "").strip() or "Уточните вопрос по меню, брони или доставке."


@csrf_exempt
@require_http_methods(["POST"])
def chat_ai(request):
    try:
        data = body_json(request)
    except ValueError as error:
        return json_error(str(error), 400)

    question = text(data.get("message"))
    if not question:
        return json_error("Сообщение обязательно", 400)

    history = data.get("history") if isinstance(data.get("history"), list) else []
    messages = []
    for item in history[-8:]:
        role = item.get("role")
        content = text(item.get("content"))[:1200]
        if role in {"user", "assistant"} and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": question[:1200]})

    try:
        answer = ask_groq(messages)
    except RuntimeError as error:
        return json_error(str(error), 503)
    return JsonResponse({"answer": answer})


def current_thread(user):
    return ChatThread.objects.filter(user=user).exclude(status=ChatThread.Status.CLOSED).order_by("-updated_at").first()


@csrf_exempt
@require_http_methods(["GET", "POST"])
def operator_thread(request):
    user = require_user(request)
    if not user:
        return json_error("Для вызова оператора нужно войти в аккаунт", 401)

    thread = current_thread(user)
    if request.method == "POST" and not thread:
        payload = user_payload(user)
        thread = ChatThread.objects.create(user=user, guest_name=payload["name"], status=ChatThread.Status.WAITING)
        ChatMessage.objects.create(
            thread=thread,
            sender=ChatMessage.Sender.SYSTEM,
            text="Новый запрос оператора.",
        )
    if not thread:
        return JsonResponse({"thread": None, "messages": []})

    return JsonResponse(
        {
            "thread": {"id": str(thread.id), "status": thread.status},
            "messages": [message_payload(message) for message in thread.messages.exclude(sender=ChatMessage.Sender.SYSTEM)],
        }
    )


@csrf_exempt
@require_http_methods(["GET", "POST"])
def operator_messages(request):
    user = require_user(request)
    if not user:
        return json_error("Для чата с оператором нужно войти в аккаунт", 401)

    thread = current_thread(user)
    if not thread:
        return json_error("Сначала вызовите оператора", 404)

    if request.method == "POST":
        try:
            data = body_json(request)
        except ValueError as error:
            return json_error(str(error), 400)
        message = text(data.get("message"))
        if not message:
            return json_error("Сообщение обязательно", 400)
        ChatMessage.objects.create(thread=thread, sender=ChatMessage.Sender.USER, author=user, text=message)
        thread.status = ChatThread.Status.WAITING
        thread.save(update_fields=["status", "updated_at"])

    return JsonResponse(
        {
            "thread": {"id": str(thread.id), "status": thread.status},
            "messages": [message_payload(message) for message in thread.messages.exclude(sender=ChatMessage.Sender.SYSTEM)],
        }
    )
