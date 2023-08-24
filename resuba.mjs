// import
import axios from "axios";
import OpenAI from 'openai';
import fs from "fs";
import dotenv from "dotenv";

//記憶回数制限
const MAX_CONVERSATION_HISTORY = 4;

//API_KEY
dotenv.config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY, // defaults to process.env["OPENAI_API_KEY"]
});
const botRoleContentPath = "botRoleContent.txt";

//filePath
const conversationFilePath = "conversation_history.json";
const judgeFilePath = "botJudgeContent.txt";

class Resuba {
  constructor(channelSecret) {
    this.api = new axios.create({
      baseURL: "https://api.line.me/v2",
      headers: {
        Authorization: `Bearer ${channelSecret}`,
        "Content-Type": "application/json",
      },
    });
    // 過去の会話データをロード
    this.conversationHistory = this.loadConversation();
    this.botRoleContent = this.loadBotRoleContent(botRoleContentPath);
    this.botJudgeContent = this.loadBotRoleContent(judgeFilePath);
  }

  async debateAI(replyToken, message) {
    // 過去の会話データと新しいメッセージからメッセージオブジェクトを構築
    const messages = this.constructMessages(message);
    const botRoleContent = this.botRoleContent.join('\n'); // プロンプトを改行区切りのテキストに結合
    const botRole = [{ "role": "system", "content": botRoleContent }]
    messages.unshift(...botRole);
    //console.log(messages);
    const completion = await openai.chat.completions.create({
      messages,
      model: 'gpt-3.5-turbo',
    });
    const aiResponse = completion.choices[0].message.content;

    // 会話履歴の管理
    this.conversationHistory.push({
      userMessage: message,
      aiResponse: {
        role: "assistant",
        content: aiResponse,
      },
    });

    if (this.conversationHistory.length > MAX_CONVERSATION_HISTORY) {
      this.conversationHistory.shift();
    }
    this.saveConversation();

    const body = {
      replyToken,
      messages: [
        {
          type: "text",
          text: aiResponse,
        },
      ],
    };

    return await this.api.post("/bot/message/reply", body);
  }
  async judgeAI(message) {
    const messages = this.constructMessages(message);
    const botRoleContent = this.botJudgeContent.join('\n'); // プロンプトを改行区切りのテキストに結合
    const botRole = [{ "role": "system", "content": botRoleContent }]
    messages.unshift(...botRole);
    // 新しいレスポンス履歴を追加
    const aiResponseHistory = this.conversationHistory.map(entry => ({
      role: "assistant",
      content: entry.aiResponse.content,
    }));
    messages.push(...aiResponseHistory);
    console.log(messages);
    const completion = await openai.chat.completions.create({
      messages,
      model: 'gpt-3.5-turbo',
    });
    const aiResponse = completion.choices[0].message.content;
    console.log(aiResponse);
    return aiResponse;
  }

  constructMessages(newMessage) {
    const messages = this.conversationHistory.map((entry) => ({
      role: "user",
      content: entry.userMessage, // 必要なデータだけ取り出す
    }));
    messages.push({ role: "user", content: newMessage });
    return messages;
  }


  loadConversation() {
    try {
      const jsonData = fs.readFileSync(conversationFilePath, "utf-8");
      return JSON.parse(jsonData);
    } catch (error) {
      console.error("Error loading conversation:", error);
      return [];
    }
  }

  saveConversation() {
    try {
      const json = JSON.stringify(this.conversationHistory, null, 2);
      fs.writeFileSync(conversationFilePath, json);
      console.log("Conversation saved.");
    } catch (error) {
      console.error("Error saving conversation:", error);
    }
  }
  loadBotRoleContent(Content) {
    try {
      const data = fs.readFileSync(Content, "utf-8");
      return data.split('\n'); // 改行でテキストを分割して配列に格納
    } catch (error) {
      console.error("Error loading bot role content:", error);
      return [];
    }
  }
}

export { Resuba };
