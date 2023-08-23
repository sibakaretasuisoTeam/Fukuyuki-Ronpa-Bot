// HTTP APIを実行しやすくするためのライブラリ: Axios
import axios from "axios";

class Resuba {
  async debateAI(replyToken, OPENAI_API_KEY) {
    const { Configuration, OpenAIApi } = require("openai");
    const configuration = new Configuration({
        apiKey: OPENAI_API_KEY,
      });
      const openai = new OpenAIApi(configuration);
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
      });
      await lineApi.replyMessage(replyToken, completion.data.choices[0].message.content);
  }
}

  export { Resuba };