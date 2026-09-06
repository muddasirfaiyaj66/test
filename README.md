# Simple Todo App

A small todo application with an Express REST API and a modern web UI. Todos
are persisted to a JSON file on disk, so no external database is required.

## Requirements

- Node.js >= 20 (developed against Node 22)

## Getting started

```bash
npm install
npm start
```

Then open http://localhost:3000 in your browser.

The server listens on `PORT` (default `3000`) and `HOST` (default `0.0.0.0`),
and stores data in `DATA_FILE` (default `data/todos.json`).

## Development

```bash
npm run dev    # start with auto-reload (node --watch)
npm test       # run the automated API tests
```

## API

| Method | Path              | Description              |
| ------ | ----------------- | ------------------------ |
| GET    | `/api/health`     | Health check             |
| GET    | `/api/todos`      | List all todos           |
| POST   | `/api/todos`      | Create a todo            |
| PATCH  | `/api/todos/:id`  | Update title / completed |
| DELETE | `/api/todos/:id`  | Delete a todo            |

### Examples

```bash
curl -s http://localhost:3000/api/todos

curl -s -X POST http://localhost:3000/api/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Buy milk"}'
```

## Project layout

```
src/
  app.js      # Express app (routes), decoupled from server startup
  server.js   # Loads the store and starts the HTTP server
  store.js    # File-backed todo store
public/       # Static frontend (HTML/CSS/JS)
test/         # node:test API tests
```
