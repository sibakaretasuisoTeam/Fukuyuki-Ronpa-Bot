// Webサーバのライブラリ: Express
import express from "express";
import crypto from "crypto";

import readline from "readline";
import fs from "fs";

// 環境変数の定義を.envファイルから読み込む（開発用途用）
import dotenv from "dotenv";

import { LineApi } from "./line-api.mjs";
import { Wiki } from "./wiki.mjs";
import { Site } from "./site.mjs";
import { Card } from "./card.mjs";
import { Resuba } from "./resuba.mjs";

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
  MENU: "MENU",
  NONE: "NONE"
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
let consecutiveHits = true;
let buttonMashing = true;

const lineApi = new LineApi(CHANNEL_ACCESS_TOKEN);
const site = new Site(CHANNEL_ACCESS_TOKEN);
const wiki = new Wiki(CHANNEL_ACCESS_TOKEN);
const card = new Card(CHANNEL_ACCESS_TOKEN);
const resubaApi = new Resuba(CHANNEL_ACCESS_TOKEN);

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

        switch (getUserState(event.source.userId)) {
          case Enum.RESUBA:
            if(buttonMashing && consecutiveHits){
              // Resuba クラスを使用してAIの返答を取得
              buttonMashing = false;
              await resubaApi.debateAI(event.replyToken, event.message.text, event.source.userId);
              const d = await resubaApi.judgeAI(event.replyToken, event.message.text, event.source.userId);
              const ans = Number(d);
              if (ans >= 7) {
                await lineApi.winMessage(event.source.userId);
                card.addExp(event.source.userId, (ans + (ans - 7) * 5));
                await lineApi.pushMessage(event.source.userId, "経験値を" + (ans + (ans - 7) * 5) + "手に入れた");
              }
              buttonMashing = true;
            }else{
              console.log("dame");
              await lineApi.pushMessage(event.source.userId,"回答を生成中です。しばらくお待ちください。");
            }
            break;
          case Enum.CARD:
            //デバッグ用
            card.addExp(event.source.userId, Number(event.message.text));
            break;
          case Enum.SITE:
            break;
          case Enum.WIKI:
          default:
            break;
        }
        break;
      case "postback": // event.typeがpostbackのとき応答
        switch (event.postback.data) {
          case "richmenu=0":
            if(consecutiveHits){
              setUserState(event.source.userId, Enum.RESUBA);
              await resubaApi.memoryReset(event.source.userId);
              await resubaApi.sendOptions(event.source.userId);
            }else{
              await lineApi.pushMessage(event.source.userId,"BUTTON MASHING YAMERO");
            }
            break;
          case "richmenu=1":
            setUserState(event.source.userId, Enum.CARD)
            await card.sendCard(event.source.userId);
            // await card.createCard(event.source.userId);
            break;
          case "richmenu=2":
            setUserState(event.source.userId, Enum.SITE)
            await lineApi.replyMessage(event.replyToken, site.sendDiscription());
            await site.pushSiteFlexMessage(event.source.userId);
            break;
          case "richmenu=3":
            setUserState(event.source.userId, Enum.WIKI)
            await wiki.sendOptions(event.source.userId);
            break;
          case "resuba=1":
            if(consecutiveHits && buttonMashing){
              consecutiveHits = false;
              //越前和紙でレスバ開始
              await resubaApi.debateAI(event.replyToken, "ディベートを始めましょう。テーマを越前和紙として先に意見を述べてください", event.source.userId);
              consecutiveHits = true;
            }else{
              await lineApi.pushMessage(event.source.userId,"BUTTON MASHING YAMERO")
            }
            break;
          case "resuba=2":
            if(consecutiveHits){
              consecutiveHits = false;
            //若狭塗り箸でレスバ開始
            await resubaApi.debateAI(event.replyToken, "ディベートを始めましょう。テーマを若さ塗り箸として先に意見を述べてください", event.source.userId);
              consecutiveHits = true;
          }else{
            await lineApi.pushMessage(event.source.userId,"BUTTON MASHING YAMERO")
          }
            break;
          case "resuba=3":
            if(consecutiveHits){
              consecutiveHits = false;
            //越前打ち刃物でレスバ開始
            await resubaApi.debateAI(event.replyToken, "ディベートを始めましょう。テーマを越前打ち刃物として先に意見を述べてください", event.source.userId);
              consecutiveHits = true;
          }else{
            await lineApi.pushMessage(event.source.userId,"BUTTON MASHING YAMERO")
          }
            break;
          case "card=1":
            await card.sendCoupon(event.source.userId);
            break;
          case "wiki=1":
            await wiki.sendWiki(event.source.userId, 1);
            break;
          case "wiki=2":
            await wiki.sendWiki(event.source.userId, 2);
            break;
          case "wiki=3":
            await wiki.sendWiki(event.source.userId, 3);
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
        await card.createCard(event.source.userId);
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

function setUserState(userId, newState) {
  const data = JSON.parse(fs.readFileSync("data/" + userId + ".json", "utf-8"));
  const n = data.name;
  const exp = data.exp;
  const level = data.level;
  const jsonData = {
    "name": n,
    "exp": exp,
    "level": level,
    "state": newState
  };

  const jsonString = JSON.stringify(jsonData);

  fs.writeFile("data/" + userId + ".json", jsonString, (err) => {
    if (err) {
      console.error('Error writing JSON file:', err);
    }
  });
}

function getUserState(userId) {
  const data = JSON.parse(fs.readFileSync("data/" + userId + ".json", "utf-8"));
  return data.state;
}

loadUserIds();
loopRL();

// U3ffeea449fc263a880fd0578aa9a4acf //泉

//リッチメニュー設定
let richMenuId = await lineApi.setRichMenu();
richMenuId = richMenuId.data.richMenuId;
await lineApi.uploadImage(richMenuId, "img/rich_menu.jpg");
await lineApi.setDefaultRichMenu(richMenuId);

//await lineApi.pushFlexMessage("U3ffeea449fc263a880fd0578aa9a4acf");
