import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Build an Express app around an already-loaded TodoStore.
// Kept separate from server startup so tests can import it directly.
export function createApp(store) {
  const app = express();
  app.use(express.json());

  const publicDir = join(__dirname, "..", "public");
  app.use(express.static(publicDir));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/todos", (_req, res) => {
    res.json(store.list());
  });

  app.post("/api/todos", async (req, res) => {
    const title = req.body?.title;
    if (typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ error: "title is required" });
    }
    const todo = await store.add(title);
    res.status(201).json(todo);
  });

  app.patch("/api/todos/:id", async (req, res) => {
    const { title, completed } = req.body ?? {};
    if (title !== undefined && (typeof title !== "string" || title.trim() === "")) {
      return res.status(400).json({ error: "title must be a non-empty string" });
    }
    if (completed !== undefined && typeof completed !== "boolean") {
      return res.status(400).json({ error: "completed must be a boolean" });
    }
    const updated = await store.update(req.params.id, { title, completed });
    if (!updated) return res.status(404).json({ error: "todo not found" });
    res.json(updated);
  });

  app.delete("/api/todos/:id", async (req, res) => {
    const ok = await store.remove(req.params.id);
    if (!ok) return res.status(404).json({ error: "todo not found" });
    res.status(204).end();
  });

  return app;
}
