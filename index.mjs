// Webサーバのライブラリ: Express
import express from "express";
import crypto from "crypto";

import readline from "readline";
import fs from "fs";

// 環境変数の定義を.envファイルから読み込む（開発用途用）
import dotenv from "dotenv";

import { LineApi } from "./line-api.mjs";
import { Wiki } from "./wiki.mjs";

// .envファイル空環境変数を読み込み
dotenv.config();
// LINEのチャネルシークレットをCHANNEL_SECRET環境変数から読み込み
const CHANNEL_SECRET = process.env.CHANNEL_SECRET;
const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;

const Enum = {
  RESUBA: "RESUBA",
  CARD: "CARD",
  SITE: "SITE",
  WIKI: "WIKI",
  MENU: "MENU"
}

let state = Enum.MENU;

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
const wiki = new Wiki();

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

        switch (state) {
          case Enum.RESUBA:
            break;
          case Enum.CARD:
            break;
          case Enum.SITE:
            break;
          case Enum.WIKI:
            await lineApi.replyMessage(event.replyToken, wiki.sendWiki(event.message.text));
            break;
        }
        break;
      case "postback": // event.typeがpostbackのとき応答
        switch (event.postback.data) {
          case "richmenu=0":
            state = Enum.RESUBA;
            await lineApi.replyMessage(event.replyToken, "リッチメニュー0");
            break;
          case "richmenu=1":
            state = Enum.CARD;
            await lineApi.replyMessage(event.replyToken, "リッチメニュー1");
            break;
          case "richmenu=2":
            state = Enum.SITE;
            await lineApi.replyMessage(event.replyToken, "伝統工芸品が購入できるサイトを紹介します。\nプレイヤーカードをレベルアップさせて入手したクーポンが使えるので是非購入してみてください。");
            await lineApi.pushSiteFlexMessage(event.source.userId);
            break;
          case "richmenu=3":
            state = Enum.WIKI;
            await lineApi.replyMessage(event.replyToken, wiki.sendOptions());
            //await client.unlinkRichMenuFromUser(event.source.userId);
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
        break;
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

// U3ffeea449fc263a880fd0578aa9a4acf //泉

//リッチメニュー設定
let richMenuId = await lineApi.setRichMenu();
richMenuId = richMenuId.data.richMenuId;
await lineApi.uploadImage(richMenuId, "img/test.png");
await lineApi.setDefaultRichMenu(richMenuId);

//await lineApi.pushFlexMessage("U3ffeea449fc263a880fd0578aa9a4acf");



