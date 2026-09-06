import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createApp } from "./app.js";
import { TodoStore } from "./store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const DATA_FILE = process.env.DATA_FILE || join(__dirname, "..", "data", "todos.json");

const store = await new TodoStore(DATA_FILE).load();
const app = createApp(store);

app.listen(PORT, HOST, () => {
  console.log(`Todo app listening on http://${HOST}:${PORT}`);
  console.log(`Persisting todos to ${DATA_FILE}`);
});
