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

  // 応答メッセージ
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

  // プッシュメッセージ
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

  //リッチメニュー作成
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

  //画像をリッチメニューに設定
  async uploadImage(richMenuId, image) {
    const apiUrl = `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`;
    const file = fs.readFileSync(image);
    const headers = {
      'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      'Content-Type': 'image/jpeg'
    };
    return await axios.post(apiUrl, file, { headers: headers })
  }

  //リッチメニューをデフォルトに設定
  async setDefaultRichMenu(richMenuId) {
    return await this.api.post("/bot/user/all/richmenu/" + richMenuId);
  }
  // プッシュメッセージ
  async winMessage(to) {
    const body = {
      to,
      messages: [
        {
          type: "text",
          text: "これまでの会話を含めておいら、負けちゃったんだよね。これっておいらの感想なんですけど福井王のおいらを言いくるめるの、素直にすごいと思うんすよね。あなたの勝ちなんでぇ、その経験値あげますよ",
        },
      ],
    };
    return await this.api.post("/bot/message/push", body);
  }
}

export { LineApi };
