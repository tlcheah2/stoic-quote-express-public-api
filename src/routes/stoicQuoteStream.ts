import type { Request, Response } from "express";

import * as quoteService from "../services/quoteService.js";

const SSE_QUOTE_INTERVAL_MS = 60_000;
const SSE_HEARTBEAT_INTERVAL_MS = 30_000;
type StoicQuote = { author: string; quote: string };

const writeEvent = (res: Response, payload: unknown) => {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

const writeNamedEvent = (res: Response, eventName: string, payload: unknown) => {
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

const writeHeartbeat = (res: Response) => {
  res.write(": heartbeat\n\n");
};

const getStoicQuote = async (): Promise<StoicQuote | undefined> => {
  const quote = await quoteService.getRandomSingleQuote({
    category: "stoic",
  });
  return quote?.[0];
};

type StreamHandlerOptions = {
  quoteIntervalMs?: number;
  heartbeatIntervalMs?: number;
  getQuote?: () => Promise<StoicQuote | undefined>;
};

export const createStoicQuoteStreamHandler = (options?: StreamHandlerOptions) => {
  const quoteIntervalMs = options?.quoteIntervalMs ?? SSE_QUOTE_INTERVAL_MS;
  const heartbeatIntervalMs =
    options?.heartbeatIntervalMs ?? SSE_HEARTBEAT_INTERVAL_MS;
  const getQuote = options?.getQuote ?? getStoicQuote;

  return async (req: Request, res: Response) => {
    const corsOrigin = process.env.CORS_ORIGIN || "*";

    const cleanup = (
      quoteInterval: NodeJS.Timeout | null,
      heartbeatInterval: NodeJS.Timeout | null,
    ) => {
      if (quoteInterval) clearInterval(quoteInterval);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };

    try {
      const initialQuote = await getQuote();
      if (!initialQuote) {
        return res.status(500).json({ error: "Unable to fetch quote" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", corsOrigin);
      res.setHeader("X-Accel-Buffering", "no");

      res.flushHeaders();
      writeEvent(res, initialQuote);

      let quoteInterval: NodeJS.Timeout | null = null;
      let heartbeatInterval: NodeJS.Timeout | null = null;

      quoteInterval = setInterval(async () => {
        try {
          const quote = await getQuote();
          if (!quote) {
            writeNamedEvent(res, "error", { error: "Unable to fetch quote" });
            return;
          }
          writeEvent(res, quote);
        } catch (error) {
          console.error("SSE quote interval error", error);
          writeNamedEvent(res, "error", { error: "Unexpected stream error" });
        }
      }, quoteIntervalMs);

      heartbeatInterval = setInterval(() => {
        try {
          writeHeartbeat(res);
        } catch (error) {
          console.error("SSE heartbeat error", error);
          cleanup(quoteInterval, heartbeatInterval);
          res.end();
        }
      }, heartbeatIntervalMs);

      req.on("close", () => {
        cleanup(quoteInterval, heartbeatInterval);
        res.end();
      });
    } catch (error) {
      console.error("SSE initial quote error", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };
};

export const stoicQuoteStreamHandler = createStoicQuoteStreamHandler();
