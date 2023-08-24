// import
import axios from "axios";
import OpenAI from 'openai';
import fs from "fs";

//記憶回数制限
const MAX_CONVERSATION_HISTORY = 4;

//API_KEY
const OPENAI_API_KEY = "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";
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY, // defaults to process.env["OPENAI_API_KEY"]
  });
  
//filePath
const conversationFilePath = "conversation_history.json";

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
      }
      
      async debateAI(replyToken,message) {
        // 過去の会話データと新しいメッセージからメッセージオブジェクトを構築
        
        //const messages = this.constructMessages(message);
        //console.log(messages);
        const completion = await openai.chat.completions.create({
            messages: this.constructMessages(message),// JSON.stringifyを使って変換
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
        
          console.log("ok");
    
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
}

  export { Resuba };