import { tavily } from "@tavily/core";
import { logger } from "../utils/index.js";

const search = async (query) => {
  const apiKey = process.env.TAVILY_API_KEY;
  const client = tavily({ apiKey });
  let response;
  try {
    response = await client.search(query, { maxResults: 3 });
  } catch (error) {
    logger.error(`Search tool error: ${error.message}`);
    return "An error occurred while performing the search.";
  }

  let formattedResults = "";
  response.results?.forEach((result, index) => {
    formattedResults += `Result ${index + 1}:\nScore: ${result.score}\nTitle: ${result.title}\nContent: ${result.content}\nURL: ${result.url}\n\n`;
  });
  return formattedResults;
};

export { search };
