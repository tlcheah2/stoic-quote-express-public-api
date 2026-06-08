import { getQuoteCollection } from "../mongodb.js";

export const getRandomSingleQuote = async (condition = {}) => {
  try {
    const quotes = await getQuoteCollection();
    return quotes
      .aggregate([
        {
          $match: condition,
        },
        {
          $project: {
            _id: 0,
            __v: 0,
            category: 0,
          },
        },
        {
          $sample: { size: 1 },
        },
      ])
      .toArray();
  } catch (err) {
    console.log("getRandomSingleQuote error", err);
    return undefined;
  }
};

export const upsertQuote = async (quoteData: {
  author: string;
  quote: string;
  category: string;
}) => {
  try {
    const quotes = await getQuoteCollection();
    const { author, quote, category } = quoteData;

    if (!author || !quote) {
      throw new Error("author and quote are required");
    }

    const filter = { quote };
    const update = { $set: { author, quote, category } };
    const options = { upsert: true, returnOriginal: false };

    const result = await quotes.findOneAndUpdate(filter, update, options);
    return result?.value;
  } catch (err) {
    console.log("upsertQuote error", err);
    throw err;
  }
};
