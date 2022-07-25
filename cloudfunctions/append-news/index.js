import fetch from "node-fetch";
import moment from "moment-timezone";

/**
 * Configure the articles you want here using the fetchArticles parameters. For example, if you'd like to get 10 sports articles, fetchArticles("sports", "everything", "en", "popularity", "10").
 * @param {*} event
 * @param {*} context
 */
export const appendNews = async (event, context) => {
  const topArticles = await fetchArticles(
    null,
    "top-headlines",
    "en",
    "popularity",
    "4"
  );
  const sportsArticles = await fetchArticles(
    "sports",
    "everything",
    "en",
    "popularity",
    "3"
  );
  const techArticles = await fetchArticles(
    "technology",
    "everything",
    "en",
    "popularity",
    "3"
  );
  const topHeadlines = [...topArticles, ...sportsArticles, ...techArticles];
  appendArticles(
    "Top Headlines",
    "bulleted_list_item",
    transformArticlesToNotionStructure(topHeadlines)
  );
  const cryptoArticles = await fetchArticles("crypto");
  appendArticles(
    "Crypto Articles",
    "bulleted_list_item",
    transformArticlesToNotionStructure(cryptoArticles)
  );
};

export const fetchArticles = async (
  query,
  endpoint = "everything",
  language = "en",
  sortBy = "popularity",
  pageSize = "5",
  from = moment()
    .tz("America/New_York")
    .subtract(1, "days")
    .format("YYYY-MM-DD")
) => {
  try {
    const response = await fetch(
      `https://newsapi.org/v2/${endpoint}?${
        query ? `q=${query}&` : ""
      }from=${from}&pageSize=${pageSize}&sortBy=${sortBy}&language=${language}&apiKey=${
        process.env.NEWS_API_KEY
      }`
    );
    if (response.status !== 200) {
      throw new Error("Failed to fetch articles: " + response.statusText);
    }
    const json = await response.json();
    return json.articles;
  } catch (e) {
    console.log("THERE WAS AN ERROR!");
    throw new Error(e);
  }
};

export const appendArticles = async (title, type, articles) => {
  const response = await fetch(process.env.WRITE_TO_ENTRY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: title,
      type: type,
      body: articles,
      contentOrProperty: "content",
      divider: true,
    }),
  });
};

export const transformArticlesToNotionStructure = (articles) => {
  return articles.map((article) => {
    return {
      content: article.title,
      link: {
        type: "url",
        url: article.url,
      },
    };
  });
};
