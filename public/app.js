const listEl = document.getElementById("list");
const summaryEl = document.getElementById("summary");
const emptyEl = document.getElementById("empty");
const composer = document.getElementById("composer");
const input = document.getElementById("new-todo");
const filtersEl = document.getElementById("filters");

let todos = [];
let filter = "all";

async function api(path, options) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

async function loadTodos() {
  todos = await api("/api/todos");
  render();
}

function visibleTodos() {
  if (filter === "active") return todos.filter((t) => !t.completed);
  if (filter === "completed") return todos.filter((t) => t.completed);
  return todos;
}

function render() {
  const visible = visibleTodos();
  listEl.innerHTML = "";

  for (const todo of visible) {
    const li = document.createElement("li");
    li.className = "item" + (todo.completed ? " is-completed" : "");
    li.dataset.id = todo.id;

    const check = document.createElement("input");
    check.type = "checkbox";
    check.className = "item__check";
    check.checked = todo.completed;
    check.setAttribute("aria-label", "Toggle todo");
    check.addEventListener("change", () => toggle(todo));

    const title = document.createElement("span");
    title.className = "item__title";
    title.textContent = todo.title;

    const del = document.createElement("button");
    del.className = "item__delete";
    del.textContent = "\u2715";
    del.setAttribute("aria-label", "Delete todo");
    del.addEventListener("click", () => remove(todo));

    li.append(check, title, del);
    listEl.append(li);
  }

  const remaining = todos.filter((t) => !t.completed).length;
  summaryEl.textContent =
    todos.length === 0
      ? "No todos yet"
      : `${remaining} of ${todos.length} remaining`;
  emptyEl.hidden = visible.length !== 0;
}

async function addTodo(title) {
  const todo = await api("/api/todos", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
  todos.push(todo);
  render();
}

async function toggle(todo) {
  const updated = await api(`/api/todos/${todo.id}`, {
    method: "PATCH",
    body: JSON.stringify({ completed: !todo.completed }),
  });
  Object.assign(todo, updated);
  render();
}

async function remove(todo) {
  await api(`/api/todos/${todo.id}`, { method: "DELETE" });
  todos = todos.filter((t) => t.id !== todo.id);
  render();
}

composer.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = input.value.trim();
  if (!title) return;
  input.value = "";
  await addTodo(title);
  input.focus();
});

filtersEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".filters__btn");
  if (!btn) return;
  filter = btn.dataset.filter;
  for (const b of filtersEl.querySelectorAll(".filters__btn")) {
    b.classList.toggle("is-active", b === btn);
  }
  render();
});

loadTodos().catch((err) => {
  summaryEl.textContent = `Error: ${err.message}`;
});
