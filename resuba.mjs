// HTTP APIを実行しやすくするためのライブラリ: Axios
import axios from "axios";
import OpenAI from 'openai';
const OPENAI_API_KEY = "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";
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY, // defaults to process.env["OPENAI_API_KEY"]
  });
  
class Resuba {
    constructor(channelSecret) {
        this.api = new axios.create({
          baseURL: "https://api.line.me/v2",
          headers: {
            Authorization: `Bearer ${channelSecret}`,
            "Content-Type": "application/json",
          },
        });
      }
      
  async debateAI(replyToken,message) {
    const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: message }],
        model: 'gpt-3.5-turbo',
      });
      const body = {
        replyToken,
        messages: [
          {
            type: "text",
            text: completion.choices[0].message.content,
          },
        ],
      };
  
      return await this.api.post("/bot/message/reply", body);
  }
}

  export { Resuba };