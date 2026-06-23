"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractQuoteDlqArn = exports.extractQuoteDlqUrl = exports.extractQuoteQueueArn = exports.extractQuoteQueueUrl = void 0;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
const awsx = __importStar(require("@pulumi/awsx"));
// Dead-letter queue for failed extract-quote messages
const extractQuoteDlq = new aws.sqs.Queue("extract-quote-dlq", {
    // Keep failed messages for 14 days before automatic deletion
    messageRetentionSeconds: 14 * 24 * 60 * 60,
});
// Main extract-quote queue that sends failed messages to the DLQ
const extractQuoteQueue = new aws.sqs.Queue("extract-quote-queue", {
    // Send messages to the DLQ after 3 failed receive attempts
    redrivePolicy: pulumi.all([extractQuoteDlq.arn]).apply(([dlqArn]) => JSON.stringify({
        deadLetterTargetArn: dlqArn,
        maxReceiveCount: 3,
    })),
});
// Export the queue URLs and ARNs
exports.extractQuoteQueueUrl = extractQuoteQueue.url;
exports.extractQuoteQueueArn = extractQuoteQueue.arn;
exports.extractQuoteDlqUrl = extractQuoteDlq.url;
exports.extractQuoteDlqArn = extractQuoteDlq.arn;
//# sourceMappingURL=index.js.map