// import
import axios from "axios";
import OpenAI from 'openai';
import fs from "fs";
import dotenv from "dotenv";
import { setupFirebase } from "./setup-firebase.mjs";
import { database } from "./firestore.mjs";

//firebaseの初期化
const firebase = new setupFirebase();
const firebaseApp = firebase.setup();
const db = new database(firebaseApp);

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
    this.botRoleContent = this.loadBotRoleContent(botRoleContentPath);
    this.botJudgeContent = this.loadBotRoleContent(judgeFilePath);
  }

  async debateAI(replyToken, message,to) {
    //const convFilePath = "data/" + to + "_conv.json";
     // 過去の会話データをロード
     this.conversationHistory = await this.loadConversation(to);
     console.log(this.conversationHistory);
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
    console.log(this.conversationHistory);

    if (this.conversationHistory.length > MAX_CONVERSATION_HISTORY) {
      this.conversationHistory.shift();
    }
    this.saveConversation(to);

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
  async judgeAI(message,to) {
    const convFilePath = "data/" + to + "_conv.json";
     // 過去の会話データをロード
     this.conversationHistory = await this.loadConversation(to);
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
  
  async memoryReset(to){
    const convFilePath = "data/" + to + "_conv.json";
    try {
      db.resetConv(to);
      this.conversationHistory = []; // ファイルを初期化したので、履歴も空にする
      console.log("Conversation history reset.");
    } catch (error) {
      console.error("Error resetting conversation history:", error);
    }
  }

  constructMessages(newMessage) {
    const messages = this.conversationHistory.map((entry) => ({
      role: "user",
      content: entry.userMessage, // 必要なデータだけ取り出す
    }));
    // 新しいメッセージを追加
    messages.push({ role: "user", content: newMessage });
  
    return messages;
  }


  loadConversation(id) {
    try {
      const Data = db.readConv(id);
      console.log("Loaded conversation data:", Data); // デバッグログ
      return Data;
    } catch (error) {
      console.error("Error loading conversation:", error);
      return [];
    }
  }

  saveConversation(id) {
    try {
      db.writeConv(this.conversationHistory,id);
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

  async sendOptions(to) {
    const body = {
      to,
      messages: [
        {
          type: "text",
          text: "こんちわっす。ふくゆきで〜す。どんな話題でおいらとディベートしたいっすか？",
          "quickReply": {
            "items": [
              {
                "type": "action",
                "imageUrl": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Bookmark%20Tabs.png",
                "action": {
                  "type": "postback",
                  "label": "越前和紙",
                  "data": "resuba=1",
                }
              },
              {
                "type": "action",
                "imageUrl": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Chopsticks.png",
                "action": {
                  "type": "postback",
                  "label": "若狭塗り箸",
                  "data": "resuba=2",
                }
              },
              {
                "type": "action",
                "imageUrl": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Kitchen%20Knife.png",
                "action": {
                  "type": "postback",
                  "label": "越前打ち刃物",
                  "data": "resuba=3",
                }
              }
            ]
          }
        },
      ]
    };
    return await this.api.post("/bot/message/push", body);
  }
}

export { Resuba };
