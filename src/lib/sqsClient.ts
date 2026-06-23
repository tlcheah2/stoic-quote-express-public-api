import { SQSClient } from "@aws-sdk/client-sqs";

/**
 * Shared SQS client.
 *
 * Configure via environment variables:
 *   SQS_QUEUE_URL  – the queue URL (required when sending messages)
 *   AWS_REGION     – AWS region (defaults to us-east-1)
 *   SQS_ENDPOINT   – optional override for LocalStack / local testing
 */
export const sqsClient = new SQSClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  endpoint: process.env.SQS_ENDPOINT as string,
});

export const getScrapeQueueUrl = (): string => {
  const queueUrl = process.env.SQS_QUEUE_URL;
  if (!queueUrl) {
    throw new Error("SQS_QUEUE_URL is not configured");
  }
  return queueUrl;
};
