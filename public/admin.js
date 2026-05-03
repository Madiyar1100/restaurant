const state = {
  admin: false,
  username: "",
  tab: "reservations",
  data: {
    users: [],
    menu: [],
    reservations: [],
    deliveries: []
  }
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = (value) => `${Number(value || 0).toLocaleString("ru-RU")} ₸`;

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "same-origin",
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
  const data = Object.fromEntries(new FormData(form).entries());
  $$("input[type='checkbox']", form).forEach((input) => {
    data[input.name] = input.checked;
  });
  return data;
}

function toast(message) {
  const node = $("[data-toast]");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("show"), 3200);
}

function setMessage(selector, message, isError = false) {
  const node = $(selector);
  if (!node) return;
  node.textContent = message;
  node.classList.toggle("error", isError);
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

function togglePassword(button) {
  const input = button.closest(".password-field").querySelector("input");
  input.type = input.type === "password" ? "text" : "password";
  button.textContent = input.type === "password" ? "◎" : "◌";
}

function setAdminMode(isAdmin, username = "") {
  state.admin = isAdmin;
  state.username = username;
  $("[data-admin-login-card]").hidden = isAdmin;
  $("[data-admin-app]").hidden = !isAdmin;
  $("[data-admin-logout]").hidden = !isAdmin;
}

async function refresh() {
  const data = await api("/api/admin/overview");
  state.data = data;
  render();
}

function categoryLabel(category) {
  return {
    sets: "Сеты",
    sushi: "Суши",
    rolls: "Роллы",
    drinks: "Саке",
    sides: "Гарниры",
    sauces: "Соусы"
  }[category] || category;
}

function statusLabel(status) {
  return {
    new: "Новая",
    confirmed: "Подтверждена",
    seated: "Гости пришли",
    cancelled: "Отменена",
    cooking: "Готовится",
    courier: "У курьера",
    delivered: "Доставлена"
  }[status] || status;
}

function field(name, value, type = "text", extra = "") {
  return `<input name="${name}" type="${type}" value="${escapeHtml(value)}" ${extra}>`;
}

function textArea(name, value) {
  return `<textarea name="${name}" rows="2">${escapeHtml(value)}</textarea>`;
}

function select(name, value, options) {
  return `
    <select name="${name}">
      ${options.map((option) => `<option value="${option}" ${option === value ? "selected" : ""}>${statusLabel(option)}</option>`).join("")}
    </select>
  `;
}

function adminButtons(collection, id) {
  return `
    <div class="admin-actions">
      <button class="mini-btn" type="button" data-save="${collection}:${id}">Сохранить</button>
      <button class="mini-btn danger" type="button" data-delete="${collection}:${id}">Удалить</button>
    </div>
  `;
}

function render() {
  $$("[data-admin-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.adminTab === state.tab);
  });
  const holder = $("[data-admin-content]");
  if (state.tab === "reservations") holder.innerHTML = renderReservations();
  if (state.tab === "deliveries") holder.innerHTML = renderDeliveries();
  if (state.tab === "menu") holder.innerHTML = renderMenuAdmin();
  if (state.tab === "users") holder.innerHTML = renderUsers();
}

function renderReservations() {
  const rows = state.data.reservations.map((item) => `
    <tr>
      <td>${escapeHtml(item.id)}</td>
      <td><form data-row-form data-collection="reservations" data-id="${item.id}">${field("name", item.name)}${field("phone", item.phone)}</form></td>
      <td>${field("date", item.date, "date", `form="${item.id}-res"`)}${field("time", item.time, "time", `form="${item.id}-res"`)}</td>
      <td>${field("guests", item.guests, "number", `min="1" form="${item.id}-res"`)}${field("occasion", item.occasion, "text", `form="${item.id}-res"`)}</td>
      <td>${textArea("notes", item.notes)}</td>
      <td>${select("status", item.status, ["new", "confirmed", "seated", "cancelled"])}</td>
      <td>${adminButtons("reservations", item.id)}</td>
    </tr>
  `).join("");
  return table(
    ["ID", "Гость", "Дата", "Детали", "Пожелания", "Статус", "Действия"],
    rows || emptyRow(7, "Броней пока нет.")
  );
}

function renderDeliveries() {
  const rows = state.data.deliveries.map((item) => `
    <tr>
      <td>${escapeHtml(item.id)}</td>
      <td><form data-row-form data-collection="deliveries" data-id="${item.id}">${field("name", item.name)}${field("phone", item.phone)}</form></td>
      <td>${field("address", item.address)}${field("timeWindow", item.timeWindow)}</td>
      <td>${escapeHtml((item.items || []).map((row) => `${row.name} x${row.quantity}`).join(", "))}<br><strong>${money(item.total)}</strong></td>
      <td>${select("payment", item.payment, ["card", "cash", "online"])}${textArea("notes", item.notes)}</td>
      <td>${select("status", item.status, ["new", "cooking", "courier", "delivered", "cancelled"])}</td>
      <td>${adminButtons("deliveries", item.id)}</td>
    </tr>
  `).join("");
  return table(
    ["ID", "Клиент", "Адрес", "Заказ", "Оплата", "Статус", "Действия"],
    rows || emptyRow(7, "Доставок пока нет.")
  );
}

function renderMenuAdmin() {
  const addForm = `
    <form class="admin-add form-grid" data-add-menu>
      <label>Название ${field("name", "")}</label>
      <label>Категория ${selectCategory("category", "rolls")}</label>
      <label>Цена ${field("price", 0, "number", "min=\"0\"")}</label>
      <label>Теги через запятую ${field("tags", "")}</label>
      <label class="wide">Описание ${textArea("description", "")}</label>
      <label class="admin-check"><input name="available" type="checkbox" checked> Доступно</label>
      <button class="primary-btn" type="submit">Добавить позицию</button>
    </form>
  `;
  const rows = state.data.menu.map((item) => `
    <tr>
      <td>${escapeHtml(item.id)}</td>
      <td><form data-row-form data-collection="menu" data-id="${item.id}">${field("name", item.name)}</form></td>
      <td>${selectCategory("category", item.category)}</td>
      <td>${field("price", item.price, "number", "min=\"0\"")}</td>
      <td>${textArea("description", item.description)}</td>
      <td>${field("tags", (item.tags || []).join(", "))}</td>
      <td><input name="available" type="checkbox" ${item.available ? "checked" : ""}></td>
      <td>${adminButtons("menu", item.id)}</td>
    </tr>
  `).join("");
  return addForm + table(
    ["ID", "Название", "Категория", "Цена", "Описание", "Теги", "Есть", "Действия"],
    rows || emptyRow(8, "Меню пока пустое.")
  );
}

function renderUsers() {
  const rows = state.data.users.map((item) => `
    <tr>
      <td>${escapeHtml(item.id)}</td>
      <td><form data-row-form data-collection="users" data-id="${item.id}">${field("name", item.name)}</form></td>
      <td>${field("email", item.email, "email")}</td>
      <td>${field("phone", item.phone)}</td>
      <td>
        <select name="role">
          <option value="guest" ${item.role === "guest" ? "selected" : ""}>guest</option>
          <option value="admin" ${item.role === "admin" ? "selected" : ""}>admin</option>
        </select>
      </td>
      <td>${field("password", "", "password", "placeholder=\"Новый пароль\"")}</td>
      <td>${adminButtons("users", item.id)}</td>
    </tr>
  `).join("");
  return table(
    ["ID", "Имя", "Email", "Телефон", "Роль", "Пароль", "Действия"],
    rows || emptyRow(7, "Пользователей пока нет.")
  );
}

function selectCategory(name, value) {
  const options = ["sets", "sushi", "rolls", "drinks", "sides", "sauces"];
  return `
    <select name="${name}">
      ${options.map((option) => `<option value="${option}" ${option === value ? "selected" : ""}>${categoryLabel(option)}</option>`).join("")}
    </select>
  `;
}

function table(headers, rows) {
  return `
    <table class="admin-table">
      <thead><tr>${headers.map((item) => `<th>${item}</th>`).join("")}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function emptyRow(columns, text) {
  return `<tr><td colspan="${columns}">${text}</td></tr>`;
}

function rowFormFromTarget(target) {
  const row = target.closest("tr");
  const firstForm = $("form[data-row-form]", row);
  if (!firstForm) return null;
  const data = formData(firstForm);
  $$("input, textarea, select", row).forEach((input) => {
    if (!input.name) return;
    data[input.name] = input.type === "checkbox" ? input.checked : input.value;
  });
  return {
    collection: firstForm.dataset.collection,
    id: firstForm.dataset.id,
    data
  };
}

function attachEvents() {
  $("[data-theme-toggle]").addEventListener("click", toggleTheme);

  document.addEventListener("click", async (event) => {
    const passwordButton = event.target.closest("[data-toggle-password]");
    if (passwordButton) togglePassword(passwordButton);

    const tab = event.target.closest("[data-admin-tab]");
    if (tab) {
      state.tab = tab.dataset.adminTab;
      render();
    }

    const saveButton = event.target.closest("[data-save]");
    if (saveButton) {
      const row = rowFormFromTarget(saveButton);
      if (!row) return;
      await api(`/api/admin/${row.collection}/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify(row.data)
      });
      toast("Запись сохранена.");
      await refresh();
    }

    const deleteButton = event.target.closest("[data-delete]");
    if (deleteButton) {
      const [collection, id] = deleteButton.dataset.delete.split(":");
      if (!confirm("Удалить запись?")) return;
      await api(`/api/admin/${collection}/${id}`, { method: "DELETE" });
      toast("Запись удалена.");
      await refresh();
    }
  });

  $("[data-admin-login-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      const data = await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify(formData(form))
      });
      form.reset();
      setAdminMode(true, data.username);
      await refresh();
      toast("Админ-панель открыта.");
    } catch (error) {
      setMessage("[data-admin-login-message]", error.message, true);
    }
  });

  $("[data-admin-logout]").addEventListener("click", async () => {
    await api("/api/admin/logout", { method: "POST" });
    setAdminMode(false);
    setMessage("[data-admin-login-message]", "Вы вышли из админки.");
  });

  document.addEventListener("submit", async (event) => {
    const addForm = event.target.closest("[data-add-menu]");
    if (!addForm) return;
    event.preventDefault();
    await api("/api/admin/menu", {
      method: "POST",
      body: JSON.stringify(formData(addForm))
    });
    addForm.reset();
    toast("Позиция добавлена.");
    await refresh();
  });
}

async function init() {
  initTheme();
  attachEvents();
  const data = await api("/api/admin/me");
  setAdminMode(data.admin, data.username || "");
  if (data.admin) await refresh();
}

init().catch((error) => toast(error.message));
