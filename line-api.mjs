// HTTP APIを実行しやすくするためのライブラリ: Axios
import axios from "axios";

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

  // ここにさらに必要に応じてAPIを呼び出すメソッドを定義しましょう

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
}

export { LineApi };
