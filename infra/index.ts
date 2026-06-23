import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

// Dead-letter queue for failed extract-quote messages
const extractQuoteDlq = new aws.sqs.Queue("extract-quote-dlq", {
  // Keep failed messages for 14 days before automatic deletion
  messageRetentionSeconds: 14 * 24 * 60 * 60,
});

// Main extract-quote queue that sends failed messages to the DLQ
const extractQuoteQueue = new aws.sqs.Queue("extract-quote-queue", {
  // Send messages to the DLQ after 3 failed receive attempts
  redrivePolicy: pulumi.all([extractQuoteDlq.arn]).apply(([dlqArn]) =>
    JSON.stringify({
      deadLetterTargetArn: dlqArn,
      maxReceiveCount: 3,
    }),
  ),
});

// Export the queue URLs and ARNs
export const extractQuoteQueueUrl = extractQuoteQueue.url;
export const extractQuoteQueueArn = extractQuoteQueue.arn;
export const extractQuoteDlqUrl = extractQuoteDlq.url;
export const extractQuoteDlqArn = extractQuoteDlq.arn;
