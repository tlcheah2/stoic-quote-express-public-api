import express from "express";

import * as quoteService from "./services/quoteService.js";
import { connectDB } from "./mongodb.js";
import { RateLimiter } from "limiter";
import { createTokenBucketLimiterMiddleware } from "./lib/tokenBucketLimiter.js";

const app = express();
// Init connection to MongoDB
connectDB();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get(
  "/stoic-quote",
  createTokenBucketLimiterMiddleware(10, "minute"),
  async (req, res) => {
    try {
      const quotes = await quoteService.getRandomSingleQuote({
        category: "stoic",
      });
      console.log("Returned quotes", quotes);
      return res.json({ data: quotes?.[0] });
    } catch (err) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

app.post("/quote", async (req, res) => {
  try {
    const quote = await quoteService.upsertQuote(req.body);
    return res.json({ data: quote });
  } catch (err) {
    if (
      err instanceof Error &&
      err.message === "author and quote are required"
    ) {
      return res.status(400).json({ error: (err as Error).message });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default app;
