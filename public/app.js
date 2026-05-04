const state = {
  user: null,
  menu: [],
  filter: "all",
  cart: new Map(),
  chatHistory: [],
  operatorMode: false,
  operatorPoll: null,
  operatorLastCount: 0,
  recognition: null,
  listening: false,
  page: "home"
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = (value) => `${Number(value || 0).toLocaleString("ru-RU")} ₸`;

const menuImages = {
  sets: "https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=725&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  sushi: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  rolls: "https://plus.unsplash.com/premium_photo-1723874570807-570c56b41e4e?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  drinks: "https://images.unsplash.com/photo-1719464455071-71364721466a?q=80&w=869&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  sides: "https://images.unsplash.com/photo-1592180387432-d735c59eee1a?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  sauces: "https://images.unsplash.com/photo-1599253334613-90aaa517759c?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
};

const dishImages = {
  "Omakase Set": "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=900&q=80",
  "Akami Nigiri": "https://images.unsplash.com/photo-1582450871972-ab5ca641643d?auto=format&fit=crop&w=900&q=80",
  "Salmon Yuzu Roll": "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=900&q=80",
  "Unagi Dragon Roll": "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=900&q=80",
  "Sake Junmai": "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80",
  "Edamame Shio": "https://images.unsplash.com/photo-1626201850122-a8fcb16665e1?auto=format&fit=crop&w=900&q=80",
  "Sauce Flight": "https://images.unsplash.com/photo-1604908554027-111cf6cf45d2?auto=format&fit=crop&w=900&q=80",
  "Wasabi & Gari Set": "https://images.unsplash.com/photo-1592180387432-d735c59eee1a?auto=format&fit=crop&w=900&q=80"
};

function imageFor(item) {
  return item.imageUrl || dishImages[item.name] || menuImages[item.category] || menuImages.rolls;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "same-origin",
    cache: "no-store",
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Ошибка запроса");
  return data;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function formData(form) {
  const data = {};
  for (const [key, value] of new FormData(form).entries()) {
    if (value instanceof File) continue;
    data[key] = value;
  }
  return data;
}

function pageFromPath() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return pageFromHref(path);
}

function pageFromHref(href) {
  const path = (href || "/").replace(/\/+$/, "") || "/";
  return {
    "/": "home",
    "/catalog": "catalog",
    "/delivery": "delivery",
    "/booking": "booking",
    "/cart": "cart",
    "/profile": "profile",
    "/about": "about"
  }[path] || "home";
}

function applyPage() {
  state.page = pageFromPath();
  document.body.dataset.page = state.page;
  const titles = {
    home: "Sakura Table - суши, роллы, саке и доставка",
    catalog: "Каталог - Sakura Table",
    delivery: "Доставка - Sakura Table",
    booking: "Бронь столика - Sakura Table",
    cart: "Корзина - Sakura Table",
    profile: "Личный кабинет - Sakura Table",
    about: "О нас - Sakura Table"
  };
  document.title = titles[state.page] || titles.home;
  $$(".site-nav a, .footer-links a").forEach((link) => {
    const linkPage = pageFromHref(link.getAttribute("href"));
    link.classList.toggle("active", linkPage === state.page);
  });
}

function toast(message) {
  const node = $("[data-toast]");
  node.textContent = message;
  node.classList.add("show");
  node.setAttribute("aria-hidden", "false");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    node.classList.remove("show");
    node.setAttribute("aria-hidden", "true");
    setTimeout(() => {
      if (!node.classList.contains("show")) node.textContent = "";
    }, 220);
  }, 2000);
}

function setMessage(selector, message, isError = false) {
  const node = $(selector);
  if (!node) return;
  node.textContent = message;
  node.classList.toggle("error", isError);
}

function isStrongPassword(password) {
  return password.length >= 8 && /[^A-Za-z0-9]/.test(password);
}

function passwordHint() {
  return "Пароль должен быть от 8 символов и содержать спецсимвол.";
}

function generatePassword() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const specials = "!@#$%&*?";
  const all = letters + digits + specials;
  const chars = [specials[Math.floor(Math.random() * specials.length)], digits[Math.floor(Math.random() * digits.length)]];
  while (chars.length < 12) chars.push(all[Math.floor(Math.random() * all.length)]);
  return chars.sort(() => crypto.getRandomValues(new Uint32Array(1))[0] - 2147483648).join("");
}

function openDialog(selector) {
  const dialog = $(selector);
  if (!dialog.open) dialog.showModal();
  document.body.classList.add("modal-open");
}

function closeDialog(selector) {
  const dialog = $(selector);
  if (dialog?.open) dialog.close();
}

function ensureLogin(message = "Сначала войдите или зарегистрируйтесь.") {
  if (state.user) return true;
  toast(message);
  openAuth("login");
  return false;
}

function initTheme() {
  const saved = localStorage.getItem("sakura-theme") || "light";
  document.documentElement.dataset.theme = saved;
  updateThemeIcon();
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("sakura-theme", next);
  updateThemeIcon();
}

function updateThemeIcon() {
  const icon = $("[data-theme-icon]");
  if (icon) icon.textContent = document.documentElement.dataset.theme === "dark" ? "☀" : "☾";
}

function renderUser() {
  const chip = $("[data-user-chip]");
  const openAuthButton = $("[data-open-auth]");
  const logoutButton = $("[data-logout]");
  const profileButton = $("[data-open-profile]");

  if (state.user) {
    chip.hidden = false;
    chip.innerHTML = `${state.user.avatarUrl ? `<img src="${escapeHtml(state.user.avatarUrl)}" alt="">` : ""}<span>${escapeHtml(state.user.name)}</span>`;
    openAuthButton.hidden = true;
    logoutButton.hidden = false;
    profileButton.hidden = false;
  } else {
    chip.hidden = true;
    openAuthButton.hidden = false;
    logoutButton.hidden = true;
    profileButton.hidden = true;
  }
  prefillPersonalForms();
}

function prefillPersonalForms() {
  if (!state.user) return;
  $$("[data-reservation-form], [data-delivery-form], [data-profile-form]").forEach((form) => {
    const name = $("input[name='name']", form);
    const phone = $("input[name='phone']", form);
    const email = $("input[name='email']", form);
    const avatar = $("input[name='avatarUrl']", form);
    if (name && !name.value) name.value = state.user.name || "";
    if (phone && !phone.value) phone.value = state.user.phone || "";
    if (email && !email.value) email.value = state.user.email || "";
    if (avatar && !avatar.value) avatar.value = state.user.avatarUrl || "";
    if (form.matches("[data-profile-form]")) updateAvatarPreview(form);
  });
}

function updateAvatarPreview(form = document) {
  const img = $("[data-avatar-preview]", form) || $("[data-avatar-preview]");
  const initials = $("[data-avatar-initials]", form) || $("[data-avatar-initials]");
  if (!img || !initials) return;
  const input = $("input[name='avatarUrl']", form);
  const value = input?.value || state.user?.avatarUrl || "";
  img.hidden = !value;
  initials.hidden = Boolean(value);
  if (value) img.src = value;
  initials.textContent = (state.user?.name || "ST").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "ST";
}

function categoryLabel(category) {
  return {
    sets: "Сет",
    sushi: "Суши",
    rolls: "Ролл",
    drinks: "Саке",
    sides: "Гарнир",
    sauces: "Соус"
  }[category] || category;
}

function tagsFor(item) {
  if (Array.isArray(item.tags)) return item.tags;
  if (typeof item.tags === "string") {
    return item.tags
      .replace(/;/g, ",")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function renderMenu() {
  const grid = $("[data-menu-grid]");
  const items = state.menu.filter((item) => state.filter === "all" || item.category === state.filter);
  grid.innerHTML = items.map((item) => `
    <article class="menu-card">
      <img class="menu-art" src="${imageFor(item)}" alt="${escapeHtml(item.name)}" loading="lazy">
      <div>
        <p class="eyebrow">${categoryLabel(item.category)}</p>
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.description)}</p>
        <div class="tag-row">
          ${tagsFor(item).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          ${item.available ? "" : `<span class="tag">нет в наличии</span>`}
        </div>
      </div>
      <div class="menu-meta">
        <span class="price">${money(item.price)}</span>
        <button class="mini-btn" type="button" data-add-cart="${item.id}" ${item.available ? "" : "disabled"}>В корзину</button>
      </div>
    </article>
  `).join("");
}

function cartRows() {
  return [...state.cart.values()];
}

function saveCart() {
  const payload = cartRows().map((row) => ({ id: row.item.id, quantity: row.quantity }));
  localStorage.setItem("sakura-cart", JSON.stringify(payload));
}

function hydrateCart() {
  let saved = [];
  try {
    saved = JSON.parse(localStorage.getItem("sakura-cart") || "[]");
  } catch {
    saved = [];
  }
  state.cart.clear();
  if (!Array.isArray(saved)) return;
  saved.forEach((row) => {
    const item = state.menu.find((entry) => entry.id === String(row.id));
    if (item && item.available) state.cart.set(item.id, { item, quantity: Math.max(1, Number(row.quantity || 1)) });
  });
}

function renderCart() {
  const rows = cartRows();
  $$("[data-cart-items]").forEach((holder) => {
    if (!rows.length) {
      holder.innerHTML = `<p>Корзина пуста. Добавьте позиции из меню.</p>`;
      return;
    }
    holder.innerHTML = rows.map(({ item, quantity }) => `
      <div class="cart-row">
        <span>${escapeHtml(item.name)}<br><small>${money(item.price)} за порцию</small></span>
        <input aria-label="Количество ${escapeHtml(item.name)}" type="number" min="1" value="${quantity}" data-cart-qty="${item.id}">
        <button class="mini-btn danger" type="button" data-cart-remove="${item.id}">Убрать</button>
      </div>
    `).join("");
  });

  const total = rows.reduce((sum, row) => sum + row.item.price * row.quantity, 0);
  $$("[data-cart-total]").forEach((node) => {
    node.textContent = money(total);
  });
  const count = rows.reduce((sum, row) => sum + row.quantity, 0);
  $("[data-cart-count]").textContent = String(count);
}

function updatePaymentDetails(targetForm = null) {
  const forms = targetForm ? [targetForm] : $$("[data-delivery-form]");
  forms.forEach((form) => {
    const details = $("[data-payment-details]", form);
    const payment = $("select[name='payment']", form)?.value;
    if (!details) return;
    details.hidden = payment !== "online";
    $$("input, select", details).forEach((input) => {
      input.disabled = payment !== "online";
    });
  });
}

function addToCart(id) {
  if (!ensureLogin("Для доставки нужен аккаунт.")) return;
  const item = state.menu.find((entry) => entry.id === id);
  if (!item || !item.available) return;
  const current = state.cart.get(id);
  state.cart.set(id, { item, quantity: current ? current.quantity + 1 : 1 });
  saveCart();
  renderCart();
  toast("Позиция добавлена в корзину.");
}

function openAuth(mode = "login") {
  setAuthMode(mode);
  setMessage("[data-auth-message]", "");
  openDialog("[data-auth-dialog]");
}

function setAuthMode(mode) {
  const login = $("[data-login-form]");
  const register = $("[data-register-form]");
  login.hidden = mode !== "login";
  register.hidden = mode !== "register";
  $$("[data-auth-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.authMode === mode);
  });
}

function openProfile() {
  if (!ensureLogin("Для редактирования профиля нужен аккаунт.")) return;
  if (state.page !== "profile") {
    window.location.href = "/profile/";
    return;
  }
  const form = $("[data-profile-form]");
  form.reset();
  $("input[name='name']", form).value = state.user.name || "";
  $("input[name='phone']", form).value = state.user.phone || "";
  $("input[name='email']", form).value = state.user.email || "";
  $("input[name='avatarUrl']", form).value = state.user.avatarUrl || "";
  updateAvatarPreview(form);
  setMessage("[data-profile-message]", "");
}

function openCart() {
  if (!ensureLogin("Для доставки нужен аккаунт.")) return;
  if (state.page !== "cart") {
    window.location.href = "/cart/";
    return;
  }
  prefillPersonalForms();
  setMessage("[data-delivery-message]", "");
  renderCart();
  updatePaymentDetails();
}

async function initData() {
  initTheme();
  const [me, menu] = await Promise.all([api("/api/me"), api("/api/menu")]);
  state.user = me.user;
  state.menu = menu.menu;
  hydrateCart();
  renderUser();
  renderMenu();
  renderCart();
  if ((state.page === "profile" || state.page === "cart") && !state.user) openAuth("login");
}

function attachEvents() {
  $(".nav-toggle").addEventListener("click", (event) => {
    const nav = $("#site-nav");
    const isOpen = nav.classList.toggle("open");
    event.currentTarget.setAttribute("aria-expanded", String(isOpen));
  });

  $("[data-theme-toggle]").addEventListener("click", toggleTheme);
  $("[data-open-auth]").addEventListener("click", () => openAuth("login"));
  $("[data-open-profile]").addEventListener("click", openProfile);
  $$("[data-open-cart]").forEach((button) => button.addEventListener("click", openCart));

  $$("dialog").forEach((dialog) => {
    dialog.addEventListener("close", () => document.body.classList.remove("modal-open"));
  });

  $$("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => setAuthMode(button.dataset.authMode));
  });

  document.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-toggle-password]");
    if (toggle) {
      const input = toggle.closest(".password-field").querySelector("input");
      input.type = input.type === "password" ? "text" : "password";
      toggle.textContent = input.type === "password" ? "◎" : "◌";
    }

    const generate = event.target.closest("[data-generate-password]");
    if (generate) {
      const form = generate.closest("form");
      const input = $("input[name='password']", form);
      input.value = generatePassword();
      input.type = "text";
      toast("Пароль сгенерирован.");
    }

    const addButton = event.target.closest("[data-add-cart]");
    if (addButton) addToCart(addButton.dataset.addCart);

    const removeButton = event.target.closest("[data-cart-remove]");
    if (removeButton) {
      state.cart.delete(removeButton.dataset.cartRemove);
      saveCart();
      renderCart();
    }
  });

  $("[data-login-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      const data = await api("/api/login", { method: "POST", body: JSON.stringify(formData(form)) });
      state.user = data.user;
      closeDialog("[data-auth-dialog]");
      form.reset();
      renderUser();
      toast("Вы вошли в аккаунт.");
    } catch (error) {
      setMessage("[data-auth-message]", error.message, true);
    }
  });

  $("[data-register-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const password = $("input[name='password']", form).value;
    if (!isStrongPassword(password)) {
      setMessage("[data-auth-message]", passwordHint(), true);
      return;
    }
    try {
      const data = await api("/api/register", { method: "POST", body: JSON.stringify(formData(form)) });
      state.user = data.user;
      closeDialog("[data-auth-dialog]");
      form.reset();
      renderUser();
      toast("Аккаунт создан.");
    } catch (error) {
      setMessage("[data-auth-message]", error.message, true);
    }
  });

  $$("[data-profile-form]").forEach((profileForm) => profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const password = $("input[name='password']", form).value;
    if (password && !isStrongPassword(password)) {
      setMessage("[data-profile-message]", passwordHint(), true);
      return;
    }
    try {
      const data = await api("/api/me", { method: "PATCH", body: JSON.stringify(formData(form)) });
      state.user = data.user;
      $("input[name='password']", form).value = "";
      renderUser();
      setMessage("[data-profile-message]", "Профиль обновлен.");
      toast("Профиль сохранен.");
    } catch (error) {
      setMessage("[data-profile-message]", error.message, true);
    }
  }));

  $("[data-logout]").addEventListener("click", async () => {
    await api("/api/logout", { method: "POST" });
    state.user = null;
    state.cart.clear();
    saveCart();
    renderUser();
    renderCart();
    toast("Вы вышли.");
  });

  $$("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      $$("[data-filter]").forEach((item) => item.classList.toggle("active", item === button));
      renderMenu();
    });
  });

  document.addEventListener("input", (event) => {
    const qtyInput = event.target.closest("[data-cart-qty]");
    if (!qtyInput) {
      const paymentSelect = event.target.closest("[data-delivery-form] select[name='payment']");
      if (paymentSelect) updatePaymentDetails(paymentSelect.closest("[data-delivery-form]"));
      if (event.target.matches("input[name='avatarUrl']")) updateAvatarPreview(event.target.closest("[data-profile-form]"));
      return;
    }
    const row = state.cart.get(qtyInput.dataset.cartQty);
    if (!row) return;
    row.quantity = Math.max(1, Number(qtyInput.value || 1));
    state.cart.set(row.item.id, row);
    saveCart();
    renderCart();
  });

  document.addEventListener("change", (event) => {
    const paymentSelect = event.target.closest("[data-delivery-form] select[name='payment']");
    if (paymentSelect) updatePaymentDetails(paymentSelect.closest("[data-delivery-form]"));

    const avatarFile = event.target.closest("[data-avatar-file]");
    if (!avatarFile || !avatarFile.files?.[0]) return;
    const form = avatarFile.closest("[data-profile-form]");
    const avatarInput = $("input[name='avatarUrl']", form);
    const reader = new FileReader();
    reader.onload = () => {
      avatarInput.value = reader.result;
      updateAvatarPreview(form);
    };
    reader.readAsDataURL(avatarFile.files[0]);
  });

  $("[data-reservation-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!ensureLogin("Для бронирования нужен аккаунт.")) return;
    try {
      await api("/api/reservations", { method: "POST", body: JSON.stringify(formData(form)) });
      form.reset();
      prefillPersonalForms();
      setMessage("[data-reservation-message]", "Бронь отправлена. Администратор увидит ее в панели.");
    } catch (error) {
      setMessage("[data-reservation-message]", error.message, true);
    }
  });

  $$("[data-delivery-form]").forEach((deliveryForm) => deliveryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!ensureLogin("Для доставки нужен аккаунт.")) return;
    if (!state.cart.size) {
      setMessage("[data-delivery-message]", "Добавьте хотя бы одну позицию в корзину.", true);
      return;
    }
    const data = {
      ...formData(form),
      items: cartRows().map((row) => ({ menuItemId: row.item.id, quantity: row.quantity }))
    };
    if (data.payment === "online" && !data.transferPhone && !data.cardLast4) {
      setMessage("[data-delivery-message]", "Для онлайн-оплаты укажите телефон перевода или последние 4 цифры карты.", true);
      return;
    }
    try {
      await api("/api/deliveries", { method: "POST", body: JSON.stringify(data) });
      form.reset();
      state.cart.clear();
      saveCart();
      renderCart();
      prefillPersonalForms();
      setMessage("[data-delivery-message]", "Заказ принят. Статус можно менять в админ-панели.");
      toast("Доставка оформлена.");
    } catch (error) {
      setMessage("[data-delivery-message]", error.message, true);
    }
  }));

  attachChatEvents();
}

function attachChatEvents() {
  const panel = $("[data-chat-panel]");
  const toggle = $("[data-chat-toggle]");
  toggle.addEventListener("click", () => {
    const next = panel.hidden;
    panel.hidden = !next;
    toggle.setAttribute("aria-expanded", String(next));
  });

  $("[data-chat-close]").addEventListener("click", () => {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  });

  $("[data-voice-input]").addEventListener("click", toggleVoiceInput);
  $("[data-call-operator]").addEventListener("click", callOperator);

  $("[data-chat-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = $("input[name='message']", form);
    const message = input.value.trim();
    if (!message) return;
    input.value = "";
    pushChat("user", message);
    if (state.operatorMode) {
      try {
        await api("/api/chat/operator/messages", {
          method: "POST",
          body: JSON.stringify({ message })
        });
        await loadOperatorMessages();
      } catch (error) {
        pushChat("assistant", error.message);
      }
      return;
    }
    const pending = pushChat("assistant", "Думаю...");
    try {
      const data = await api("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message, history: state.chatHistory })
      });
      pending.textContent = data.answer;
      state.chatHistory.push({ role: "user", content: message }, { role: "assistant", content: data.answer });
    } catch (error) {
      pending.textContent = error.message || "AI-чат пока недоступен. Проверьте GROQ_API_KEY на сервере.";
    }
  });
}

async function callOperator() {
  if (!ensureLogin("Чтобы вызвать оператора, войдите или зарегистрируйтесь.")) return;
  try {
    const data = await api("/api/chat/operator", { method: "POST", body: JSON.stringify({}) });
    state.operatorMode = true;
    state.operatorLastCount = 0;
    $("[data-chat-note]").textContent = "Оператор вызван. Ответ администратора появится здесь автоматически.";
    pushChat("assistant", "Оператор скоро подключится в этом чате.");
    renderOperatorMessages(data.messages || []);
    clearInterval(state.operatorPoll);
    state.operatorPoll = setInterval(loadOperatorMessages, 5000);
  } catch (error) {
    pushChat("assistant", error.message);
  }
}

async function loadOperatorMessages() {
  if (!state.operatorMode) return;
  try {
    const data = await api("/api/chat/operator/messages");
    renderOperatorMessages(data.messages || []);
  } catch (error) {
    $("[data-chat-note]").textContent = error.message;
  }
}

function renderOperatorMessages(messages) {
  if (messages.length <= state.operatorLastCount) return;
  messages.slice(state.operatorLastCount).forEach((message) => {
    if (message.sender === "user") return;
    pushChat(message.sender === "admin" ? "assistant" : "assistant", message.text);
  });
  state.operatorLastCount = messages.length;
}

function toggleVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const note = $("[data-chat-note]");
  if (!SpeechRecognition) {
    note.textContent = "Голосовой ввод не поддерживается этим браузером.";
    return;
  }

  if (!state.recognition) {
    state.recognition = new SpeechRecognition();
    state.recognition.lang = "ru-RU";
    state.recognition.interimResults = false;
    state.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      $("#chat-message").value = transcript;
      note.textContent = "Речь распознана. Нажмите отправить или отредактируйте текст.";
    };
    state.recognition.onend = () => {
      state.listening = false;
      $("[data-voice-input]").classList.remove("listening");
    };
    state.recognition.onerror = () => {
      note.textContent = "Не удалось распознать речь. Проверьте доступ к микрофону.";
    };
  }

  if (state.listening) {
    state.recognition.stop();
    return;
  }
  state.listening = true;
  $("[data-voice-input]").classList.add("listening");
  note.textContent = "Слушаю...";
  state.recognition.start();
}

function pushChat(role, content) {
  const log = $("[data-chat-log]");
  const node = document.createElement("p");
  node.className = role === "user" ? "user-msg" : "assistant-msg";
  node.textContent = content;
  log.append(node);
  log.scrollTop = log.scrollHeight;
  return node;
}

applyPage();
attachEvents();
initData().catch((error) => toast(error.message));
