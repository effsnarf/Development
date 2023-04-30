import { ChatOpenAI, Roles } from "../../OpanAI/classes/ChatOpenAI";

// SummaryGPT class
// Uses the chat conversation to summarize long texts
// Used for example to summarize a web page

class SummaryGPT {
  static async summarize(text: string) {
    console.log("Summarizing texts...");
    // Create a new chat
    let chat = await ChatOpenAI.new(Roles.SummaryGPT);

    let chunks = SummaryGPT.getChunks(text);
    chunks.push("Summarize everything I said in one paragraph.");
    let summary = await chat.sendSeveral(chunks);

    return summary;
  }

  private static getChunks(text: string, chunkSize = 100) {
    // Split by spaces
    let words = text.split(" ");
    let chunks = [];
    let chunk = "";
    for (let word of words) {
      if (chunk.length + word.length > chunkSize) {
        chunk = chunk.trim();
        chunks.push(chunk);
        chunk = "";
      }
      chunk += word + " ";
    }
    chunks.push(chunk);
    return chunks;
  }
}

export { SummaryGPT };
