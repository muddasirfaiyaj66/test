import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { createApp } from "../src/app.js";
import { TodoStore } from "../src/store.js";

let server;
let baseUrl;
let dataDir;
let store;

before(async () => {
  dataDir = await mkdtemp(join(tmpdir(), "todo-test-"));
  store = await new TodoStore(join(dataDir, "todos.json")).load();
  const app = createApp(store);
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await rm(dataDir, { recursive: true, force: true });
});

beforeEach(async () => {
  // Reset store between tests for isolation.
  store.todos = [];
  await store.persist();
});

async function req(path, options) {
  const res = await fetch(baseUrl + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = res.status === 204 ? null : await res.json();
  return { status: res.status, body };
}

test("health endpoint responds ok", async () => {
  const { status, body } = await req("/api/health");
  assert.equal(status, 200);
  assert.deepEqual(body, { status: "ok" });
});

test("starts with an empty list", async () => {
  const { status, body } = await req("/api/todos");
  assert.equal(status, 200);
  assert.deepEqual(body, []);
});

test("creates a todo", async () => {
  const { status, body } = await req("/api/todos", {
    method: "POST",
    body: JSON.stringify({ title: "Buy milk" }),
  });
  assert.equal(status, 201);
  assert.equal(body.title, "Buy milk");
  assert.equal(body.completed, false);
  assert.ok(body.id);
});

test("rejects empty titles", async () => {
  const { status } = await req("/api/todos", {
    method: "POST",
    body: JSON.stringify({ title: "   " }),
  });
  assert.equal(status, 400);
});

test("toggles completion", async () => {
  const created = await req("/api/todos", {
    method: "POST",
    body: JSON.stringify({ title: "Walk dog" }),
  });
  const { status, body } = await req(`/api/todos/${created.body.id}`, {
    method: "PATCH",
    body: JSON.stringify({ completed: true }),
  });
  assert.equal(status, 200);
  assert.equal(body.completed, true);
});

test("deletes a todo", async () => {
  const created = await req("/api/todos", {
    method: "POST",
    body: JSON.stringify({ title: "Temp" }),
  });
  const del = await req(`/api/todos/${created.body.id}`, { method: "DELETE" });
  assert.equal(del.status, 204);
  const list = await req("/api/todos");
  assert.deepEqual(list.body, []);
});

test("returns 404 for missing todo", async () => {
  const { status } = await req("/api/todos/does-not-exist", {
    method: "PATCH",
    body: JSON.stringify({ completed: true }),
  });
  assert.equal(status, 404);
});

test("persists todos across store reloads", async () => {
  await req("/api/todos", {
    method: "POST",
    body: JSON.stringify({ title: "Persisted" }),
  });
  const reloaded = await new TodoStore(store.filePath).load();
  assert.equal(reloaded.list().length, 1);
  assert.equal(reloaded.list()[0].title, "Persisted");
});
