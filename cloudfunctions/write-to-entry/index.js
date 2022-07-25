import { Client } from "@notionhq/client";
import moment from "moment-timezone";

const notion = new Client({ auth: process.env.NOTION_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;
const date = moment().tz("America/New_York").format("YYYY-MM-DD");
const pageId = await getEntryPageIdFromDate(date);

export const writeToEntry = async (req, res) => {
  const params = req.body;
  const contentOrProperty = params.contentOrProperty;
  if (contentOrProperty === "content") {
    try {
      writeContent(params);
      res.send(
        `Success! ${params.title} added to page ${date} (page id: ${pageId}).`
      );
    } catch (e) {
      console.error(e);
      res.send(e);
    }
  } else if (contentOrProperty === "property") {
    try {
      updateProperty(params);
      res.send(`property ${params.property} updated to ${params.value}`);
    } catch (e) {
      console.error(e);
      res.send(e);
    }
  } else {
    console.log("No page location specified");
    res.send("No page location specified");
  }
};

async function writeContent(params) {
  const blocks = await transformDataToBlocks(
    params.title,
    params.type,
    params.body,
    params.divider
  );
  try {
    appendBlocksToPage(blocks, pageId);
  } catch (e) {
    console.error(e);
    res.send(e);
  }
}

async function updateProperty(params) {
  let property = params.property;
  let value = params.value;
  let type = params.type;
  let properties = {};
  switch (type) {
    case "text":
      properties[property] = {
        rich_text: [
          {
            type: "text",
            text: {
              content: value,
            },
          },
        ],
      };
      break;
    case "number":
      properties[property] = {
        number: Number(value),
      };
      break;
    default:
      console.error("Invalid type");
      break;
  }
  await notion.pages.update({
    page_id: pageId,
    properties,
  });
}

async function addPage(date) {
  try {
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        title: {
          title: [
            {
              text: {
                content: date,
              },
            },
          ],
        },
        Date: {
          date: {
            start: date,
          },
        },
      },
    });
    console.log(response);
    console.log("Success! Entry added.");
    return response;
  } catch (error) {
    console.error(error.body);
  }
}

/**
 * Retrieves a page ID from a Notion Calendar DB. If no date is provided, it uses the current day.
 * @param {*} date (optional)
 * @returns {string} [page ID]
 */
async function getEntryPageIdFromDate(date) {
  if (date) {
    date = new Date(date);
  } else {
    date = new Date();
  }
  date = date.toISOString().substr(0, 10); // Date property in notion calendars is ISO8601 without hours in the string
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        or: [
          {
            property: "Date",
            date: {
              equals: date,
            },
          },
        ],
      },
    });
    if (response.results.length === 0) {
      console.log("No results found");
      // Create a page
      const newPage = await addPage(date);

      return newPage.id;
    } else {
      return response.results[0].id;
    }
  } catch (error) {
    console.error(error.body);
  }
}

async function appendBlocksToPage(blocks, pageId) {
  await notion.blocks.children.append({
    block_id: pageId,
    children: blocks,
  });
}

/**
 *
 * @param {String} title
 * @param {String} type numbered_list_item, paragraph, bulleted_list_item
 * @param {Array} body Either an array of strings or an array of objects {content, link}
 * @param {Boolean} divider Do you want a divider at the bottom?
 */
async function transformDataToBlocks(title, type, body, divider) {
  // It's really difficult to create an array from Siri Shortcuts. This allows us to pass in a stringified array.
  if (typeof body == "string") {
    body = JSON.parse(body);
  }
  let blocks = [
    {
      type: "heading_1",
      heading_1: {
        rich_text: [
          {
            type: "text",
            text: {
              content: title,
              link: null,
            },
          },
        ],
        color: "default",
      },
    },
  ];

  body.forEach((line) => {
    let data = {
      type: type,
    };
    if (type === "bookmark") {
      // bookmark data structure is different
      data[type] = {
        url: line,
      };
    } else {
      data[type] = {
        rich_text: [
          {
            type: "text",
            text: {
              content: typeof line === "string" ? line : line.content, // line will either be a string or an object
              link: line.link ? line.link : null,
            },
          },
        ],
        color: "default",
      };
    }
    blocks.push(data);
  });

  if (divider) {
    // Push an empty line for aesthetics
    blocks.push({
      type: "paragraph",
      paragraph: {
        rich_text: [
          {
            type: "text",
            text: {
              content: "",
              link: null,
            },
          },
        ],
      },
    });
    blocks.push({
      type: "divider",
      divider: {},
    });
  }
  return blocks;
}
