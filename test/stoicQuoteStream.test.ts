import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createServer, type Server } from "node:http";
import { setTimeout as delay } from "node:timers/promises";

import express from "express";

import { createStoicQuoteStreamHandler } from "../src/routes/stoicQuoteStream.js";

let activeServer: Server | null = null;

const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
    }),
  ]);
};

const startTestServer = async (
  streamHandler: ReturnType<typeof createStoicQuoteStreamHandler>,
) => {
  const app = express();
  app.get("/stoic-quote/stream", streamHandler);

  const server = createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, resolve);
  });
  activeServer = server;

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Unable to read test server address");
  }

  return {
    server,
    url: `http://127.0.0.1:${address.port}/stoic-quote/stream`,
  };
};

afterEach(async () => {
  if (!activeServer) return;
  await new Promise<void>((resolve) => activeServer?.close(() => resolve()));
  activeServer = null;
});

test("streams an immediate quote with SSE headers", async () => {
  process.env.CORS_ORIGIN = "http://localhost:5173";

  const streamHandler = createStoicQuoteStreamHandler({
    quoteIntervalMs: 10_000,
    heartbeatIntervalMs: 10_000,
    getQuote: async () => ({
      author: "Marcus Aurelius",
      quote: "You have power over your mind.",
    }),
  });

  const { url } = await startTestServer(streamHandler);
  const response = await fetch(url);

  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get("access-control-allow-origin"),
    "http://localhost:5173",
  );
  assert.match(response.headers.get("content-type") ?? "", /text\/event-stream/i);

  const reader = response.body?.getReader();
  assert.ok(reader, "expected stream reader");

  const chunk = await withTimeout(reader!.read(), 1500);
  assert.equal(chunk.done, false);

  const text = new TextDecoder().decode(chunk.value);
  assert.match(text, /data:\s*\{"author":"Marcus Aurelius","quote":"You have power over your mind\."\}/);

  await reader?.cancel();
});

test("emits heartbeat comments while stream is open", async () => {
  const streamHandler = createStoicQuoteStreamHandler({
    quoteIntervalMs: 10_000,
    heartbeatIntervalMs: 30,
    getQuote: async () => ({
      author: "Epictetus",
      quote: "Freedom is the only worthy goal in life.",
    }),
  });

  const { url } = await startTestServer(streamHandler);
  const response = await fetch(url);
  const reader = response.body?.getReader();
  assert.ok(reader, "expected stream reader");

  // Read initial quote event first.
  await withTimeout(reader!.read(), 1500);
  await delay(60);

  const nextChunk = await withTimeout(reader!.read(), 1500);
  const text = new TextDecoder().decode(nextChunk.value);
  assert.match(text, /: heartbeat/);

  await reader?.cancel();
});

test("returns 500 when initial quote fetch fails", async () => {
  const streamHandler = createStoicQuoteStreamHandler({
    getQuote: async () => undefined,
  });
  const { url } = await startTestServer(streamHandler);

  const response = await fetch(url);
  assert.equal(response.status, 500);

  const data = (await response.json()) as { error: string };
  assert.equal(data.error, "Unable to fetch quote");
});
