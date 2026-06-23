import type { Request, Response } from "express";
import { SendMessageCommand } from "@aws-sdk/client-sqs";

import { sqsClient, getScrapeQueueUrl } from "../lib/sqsClient.js";

/**
 * POST /extract-quote-job
 *
 * Accepts a JSON body: { url: string, category?: string }
 * Enqueues a scrape job onto SQS and returns 202 Accepted.
 */
export const extractQuoteJobHandler = async (req: Request, res: Response) => {
  const { url, category } = req.body ?? {};

  if (typeof url !== "string" || !url.startsWith("http")) {
    return res.status(400).json({ error: "A valid http(s) 'url' is required" });
  }

  const messageBody: { url: string; category?: string } = { url };
  if (typeof category === "string" && category.trim().length > 0) {
    messageBody.category = category.trim();
  }

  try {
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: getScrapeQueueUrl(),
        MessageBody: JSON.stringify(messageBody),
      }),
    );

    return res.status(202).json({
      status: "accepted",
      message: "Quote extraction job enqueued",
      data: messageBody,
    });
  } catch (err) {
    console.error("extractQuoteJob SQS send error", err);
    return res.status(502).json({ error: "Failed to enqueue extraction job" });
  }
};
