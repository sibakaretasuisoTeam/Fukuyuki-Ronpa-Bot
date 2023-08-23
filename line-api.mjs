// HTTP APIを実行しやすくするためのライブラリ: Axios
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();
const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;

// LINE APIのラッパー
class LineApi {
  constructor(channelSecret) {
    this.api = new axios.create({
      baseURL: "https://api.line.me/v2",
      headers: {
        Authorization: `Bearer ${channelSecret}`,
        "Content-Type": "application/json",
      },
    });
  }

  // 応答メッセージAPI
  async replyMessage(replyToken, message) {
    const body = {
      replyToken,
      messages: [
        {
          type: "text",
          text: message,
        },
      ],
    };

    return await this.api.post("/bot/message/reply", body);
  }

  // プッシュメッセージAPI
  async pushMessage(to, message) {
    const body = {
      to,
      messages: [
        {
          type: "text",
          text: message,
        },
      ],
    };
    return await this.api.post("/bot/message/push", body);
  }

  //ボタンテンプレートメッセージAPI
  async startJanken(to) {
    const body = {
      to,
      messages: [
        {
          type: "template",
          altText: "じゃんけん",
          template: {
            type: "buttons",
            text: "じゃんけんしましょう",
            actions: [
              {
                type: "postback",
                label: "ぐー",
                data: "action=gu"
              },
              {
                "type": "postback",
                "label": "ちょき",
                "data": "action=choki"
              },
              {
                "type": "postback",
                "label": "ぱー",
                "data": "action=pa"
              }
            ]
          },
        },
      ],
    };
    return await this.api.post("/bot/message/push", body);
  }

  //リッチメニュー作成API
  async setRichMenu() {
    const body = {
      "size": {
        "width": 2500,
        "height": 1686
      },
      "selected": true,
      "name": "Rich Menu Example",
      "chatBarText": "メニューを開く",
      "areas": [
        {
          "bounds": {
            "x": 0,
            "y": 0,
            "width": 1250,
            "height": 843
          },
          "action": {
            "type": "postback",
            "data": "richmenu=0"
          }
        },
        {
          "bounds": {
            "x": 1250,
            "y": 0,
            "width": 1250,
            "height": 843
          },
          "action": {
            "type": "postback",
            "data": "richmenu=1"
          }
        },
        {
          "bounds": {
            "x": 0,
            "y": 843,
            "width": 1250,
            "height": 843
          },
          "action": {
            "type": "postback",
            "data": "richmenu=2"
          }
        },
        {
          "bounds": {
            "x": 1250,
            "y": 843,
            "width": 1250,
            "height": 843
          },
          "action": {
            "type": "postback",
            "data": "richmenu=3"
          }
        }
      ]
    }
    return await this.api.post("/bot/richmenu", body);
  }

  //画像をアップロードするAPI
  async uploadImage(richMenuId, image) {
    const apiUrl = `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`;
    const file = fs.readFileSync(image);
    const headers = {
      'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      'Content-Type': 'image/jpeg'
    };
    return await axios.post(apiUrl, file, { headers: headers })
  }

  async setDefaultRichMenu(richMenuId) {
    return await this.api.post("/bot/user/all/richmenu/" + richMenuId);
  }
}
export { LineApi };
