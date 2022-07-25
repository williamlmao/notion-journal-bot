import fetch from "node-fetch";
import moment from "moment-timezone";

const monthlyCourseCorrection = {
  title: "Monthly Course Correction",
  type: "heading_3",
  body: [
    "What really matters right now in my life? Am I dedicating the necessary energy towards those things?",
    "Are my current systems and habits aligned with my long-term goals?",
    "What do I need to cut out of my life?",
  ],
  divider: true,
  contentOrProperty: "content",
};

const dailyThoughts = {
  title: "What's on your mind?",
  type: "paragraph",
  body: [],
  divider: true,
  contentOrProperty: "content",
};

export const appendPrompts = async () => {
  try {
    // Append a different prompt for the first day of the month
    if (moment().format("D") === "1") {
      await makeAppendPromptRequest(monthlyCourseCorrection);
    }
    await makeAppendPromptRequest(dailyThoughts);
  } catch (e) {
    console.error(e);
  }
};

export const makeAppendPromptRequest = async (prompt) => {
  const response = await fetch(process.env.WRITE_TO_ENTRY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(prompt),
  });
};
