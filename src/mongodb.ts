// Import the dependency.
import { Db, MongoClient } from "mongodb";

let mongoClient: MongoClient;
let db: Db;

export const connectDB = async () => {
  // Create a module-scoped connection promise.
  // CRITICAL: You must call connect outside the handler so that the client
  // can be reused across function invocations.
  if (!mongoClient) {
    mongoClient = await MongoClient.connect(process.env.MONGODB_URI as string);
    db = mongoClient.db("quote");
    console.log("Connected to DB successfully");
  }
  return mongoClient;
};

export const getQuoteCollection = async () => {
  if (!mongoClient) {
    await connectDB();
  }
  if (db) return db.collection("quotes");
  throw new Error("No Quote Collection found");
};
