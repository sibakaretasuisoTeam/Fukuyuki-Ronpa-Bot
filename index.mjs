// Webサーバのライブラリ: Express
import express from "express";
import crypto from "crypto";

import readline from "readline";
import fs from "fs";

// 環境変数の定義を.envファイルから読み込む（開発用途用）
import dotenv from "dotenv";

import { LineApi } from "./line-api.mjs";

// .envファイル空環境変数を読み込み
dotenv.config();
// LINEのチャネルシークレットをCHANNEL_SECRET環境変数から読み込み
const CHANNEL_SECRET = process.env.CHANNEL_SECRET;
const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;

// expressの初期化
const app = express();
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
// TCP/8080ポートでサーバを起動
app.listen(8080);

const lineApi = new LineApi(CHANNEL_ACCESS_TOKEN);

//ユーザーIDを格納する配列
let userIds = [];

//fsでtxtファイルにユーザーIDを保存する関数
function saveUserIds() {
  fs.readFile('userIds.txt', 'utf8', (err, data) => {
    for (let userId of userIds) {
      if (data.includes(userId)) continue;
      fs.appendFile("userIds.txt", userId + "\n", (err) => {
        if (err) throw err;
      });
    }
  });
}

//fsでtxtファイルからユーザーIDを読み込む関数
function loadUserIds() {
  fs.readFile('userIds.txt', 'utf8', (err, data) => {
    if (err) throw err;
    // ユーザーIDを配列に保存
    userIds = data.split('\n').filter(id => id);
    console.log("loaded userIds:");
    console.log(userIds);
  });
}

// ルートのエンドポイント定義
// レスポンスがきちんと返せているかの確認用
app.get("/", (request, response) => {
  response.status(200).send("Hello");
});

// webhookを受け取るエンドポイントを定義
// POST /webhook
app.post("/webhook", (request, response, buf) => {
  // https://developers.line.biz/ja/docs/messaging-api/receiving-messages/

  // 受け取ったwebhookのイベント
  const body = request.body;
  // デバッグ用として出力
  console.log(body);

  // 署名検証（全くの第三者がリクエストを送ってきたときの対策＝なくても動くが本番環境では大事）
  if (!verifySignature(request.rawBody, request.headers["x-line-signature"], CHANNEL_SECRET)) {
    response.status(401).send({});
    return;
  }

  // 到着したイベントのevents配列から取りだし
  body.events.forEach(async (event) => {
    switch (event.type) {
      case "message": // event.typeがmessageのとき応答
        // ユーザーIDが配列になかったら格納
        if (!userIds.includes(event.source.userId)) {
          userIds.push(event.source.userId);
          saveUserIds();
        }

        switch (event.message.text) {
          case "じゃんけん":
            await lineApi.startJanken(event.source.userId);
            break;

          default:
            await lineApi.replyMessage(event.replyToken, `返信: ${event.message.text}`);
            break;
        }
        console.log('\x1b[34m', event.source.userId + " : " + event.message.text);
        break;
      case "postback": // event.typeがpostbackのとき応答
        //ランダムに手を選ぶ
        const hand = Math.floor(Math.random() * 3);
        switch (event.postback.data) {
          case "action=gu":
            if (hand == 0) {
              await lineApi.replyMessage(event.replyToken, "こちらの手もぐー、あいこ！");
            }
            else if (hand == 1) {
              await lineApi.replyMessage(event.replyToken, "こちらの手はちょき、あなたの勝ち！");
            }
            else {
              await lineApi.replyMessage(event.replyToken, "こちらの手はぱー、あなたの負け！");
            }
            break;
          case "action=choki":
            if (hand == 0) {
              await lineApi.replyMessage(event.replyToken, "こちらの手はぐー、あなたの負け！");
            }
            else if (hand == 1) {
              await lineApi.replyMessage(event.replyToken, "こちらの手もちょき、あいこ！");
            }
            else {
              await lineApi.replyMessage(event.replyToken, "こちらの手はぱー、あなたの勝ち！");
            }
            break;
          case "action=pa":
            if (hand == 0) {
              await lineApi.replyMessage(event.replyToken, "こちらの手はぐー、あなたの勝ち！");
            }
            else if (hand == 1) {
              await lineApi.replyMessage(event.replyToken, "こちらの手はちょき、あなたの負け！");
            }
            else {
              await lineApi.replyMessage(event.replyToken, "こちらの手もぱー、あいこ！");
            }
            break;

          default:
            break;
        }
        break;
      case "follow": // event.typeがfollowのとき応答
        // ユーザーIDが配列になかったら格納
        if (!userIds.includes(event.source.userId)) {
          userIds.push(event.source.userId);
          saveUserIds();
        }
        await lineApi.replyMessage(event.replyToken, "友達追加ありがとう!あなたのユーザーIDは" + event.source.userId + "です");
    }
  });

  response.status(200).send({});
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

//標準入力から関数を呼び出す
function loopRL() {
  rl.question("> ", async (input) => {
    const [command, ...args] = input.split(" ");
    switch (command) {
      case "push":
        await lineApi.pushMessage(args[0], args[1]);
        break;
      case "pushall":
        for (let userID of userIds) {
          await lineApi.pushMessage(userID, args.join(" "));
        }
        break;
      case "friend":
        for (let userID of userIds) {
          console.log(userID);
        }
      default:
        break;
    }
    loopRL();
  });
}

// webhookの署名検証
// https://developers.line.biz/ja/reference/messaging-api/#signature-validation
function verifySignature(body, receivedSignature, channelSecret) {
  const signature = crypto.createHmac("SHA256", channelSecret).update(body).digest("base64");
  return signature === receivedSignature;
}


loadUserIds();
loopRL();

//lineApi.pushMessage("U3ffeea449fc263a880fd0578aa9a4acf", "起動しました");

lineApi.startJanken("U3ffeea449fc263a880fd0578aa9a4acf"); //泉

//lineApi.startJanken("Ufd7b503783bad7695290ecd25dc34313"); //並河

//lineApi.startJanken("Ub32f6da1c67cdec255fdc322807c9c4a"); //野尻
