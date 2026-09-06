import { randomUUID } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

// A tiny file-backed store for todos. Not intended for concurrent
// multi-process use, but perfect for a simple single-process app.
export class TodoStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.todos = [];
    this.loaded = false;
  }

  async load() {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      this.todos = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      // A missing file simply means we start empty.
      if (err.code !== "ENOENT") throw err;
      this.todos = [];
    }
    this.loaded = true;
    return this;
  }

  async persist() {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(this.todos, null, 2));
  }

  list() {
    return [...this.todos].sort((a, b) => a.createdAt - b.createdAt);
  }

  get(id) {
    return this.todos.find((t) => t.id === id);
  }

  async add(title) {
    const todo = {
      id: randomUUID(),
      title: String(title).trim(),
      completed: false,
      createdAt: Date.now(),
    };
    this.todos.push(todo);
    await this.persist();
    return todo;
  }

  async update(id, patch) {
    const todo = this.get(id);
    if (!todo) return undefined;
    if (typeof patch.title === "string") todo.title = patch.title.trim();
    if (typeof patch.completed === "boolean") todo.completed = patch.completed;
    await this.persist();
    return todo;
  }

  async remove(id) {
    const idx = this.todos.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    this.todos.splice(idx, 1);
    await this.persist();
    return true;
  }
}
