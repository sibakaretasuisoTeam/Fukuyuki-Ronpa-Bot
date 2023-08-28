// Webサーバのライブラリ: Express
import express from "express";
import crypto from "crypto";

import readline from "readline";
import { Client } from '@line/bot-sdk';

// 環境変数の定義を.envファイルから読み込む（開発用途用）
import dotenv from "dotenv";

import { LineApi } from "./line-api.mjs";
import { Wiki } from "./wiki.mjs";
import { Site } from "./site.mjs";
import { Card } from "./card.mjs";
import { Resuba } from "./resuba.mjs";
import { setupFirebase } from "./setup-firebase.mjs";
import { database } from "./firestore.mjs";

// .envファイル空環境変数を読み込み
dotenv.config();
// LINEのチャネルシークレットをCHANNEL_SECRET環境変数から読み込み
const CHANNEL_SECRET = process.env.CHANNEL_SECRET;
const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

const client = new Client(config);

const Enum = {
  RESUBA: "RESUBA",
  CARD: "CARD",
  SITE: "SITE",
  WIKI: "WIKI",
  MENU: "MENU",
  NONE: "NONE"
}

// expressの初期化
const app = express();
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

//firebaseの初期化
const firebase = new setupFirebase();
const firebaseApp = firebase.setup();
const db = new database(firebaseApp);


// TCP/8080ポートでサーバを起動
app.listen(8080);
let consecutiveHits = true;
let buttonMashing = true;

const lineApi = new LineApi(CHANNEL_ACCESS_TOKEN);
const site = new Site(CHANNEL_ACCESS_TOKEN);
const wiki = new Wiki(CHANNEL_ACCESS_TOKEN);
const card = new Card(CHANNEL_ACCESS_TOKEN);
const resubaApi = new Resuba(CHANNEL_ACCESS_TOKEN);

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
        if (event.message.type == "text") {
          switch (await getUserState(event.source.userId)) {
            case Enum.RESUBA:
              if (buttonMashing && consecutiveHits) {
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
              } else {
                console.log("dame");
                await lineApi.pushMessage(event.source.userId, "回答を生成中です。しばらくお待ちください。");
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
        }
        break;
      case "postback": // event.typeがpostbackのとき応答
        switch (event.postback.data) {
          case "richmenu=0":
            if (consecutiveHits) {
              setUserState(event.source.userId, Enum.RESUBA);
              await resubaApi.memoryReset(event.source.userId);
              await resubaApi.sendOptions(event.source.userId);
            } else {
              await lineApi.pushMessage(event.source.userId, "回答を生成中です。\nしばらくお待ちください。");
            }
            break;
          case "richmenu=1":
            //await createUserData(event.source.userId);
            setUserState(event.source.userId, Enum.CARD)
            await card.sendCard(event.source.userId);

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
            consecutiveHits = false;
            //越前和紙でレスバ開始
            await lineApi.pushMessage(event.source.userId, "回答を生成中です。\nしばらくお待ちください。");
            await resubaApi.debateAI(event.replyToken, "ディベートを始めましょう。テーマを越前和紙として先に意見を述べてください", event.source.userId);
            consecutiveHits = true;
            break;
          case "resuba=2":
            consecutiveHits = false;
            //若狭塗り箸でレスバ開始
            await lineApi.pushMessage(event.source.userId, "回答を生成中です。\nしばらくお待ちください。");
            await resubaApi.debateAI(event.replyToken, "ディベートを始めましょう。テーマを若さ塗り箸として先に意見を述べてください", event.source.userId);
            consecutiveHits = true;
            break;
          case "resuba=3":
            consecutiveHits = false;
            //越前打ち刃物でレスバ開始
            await lineApi.pushMessage(event.source.userId, "回答を生成中です。\nしばらくお待ちください。");
            await resubaApi.debateAI(event.replyToken, "ディベートを始めましょう。テーマを越前打ち刃物として先に意見を述べてください", event.source.userId);
            consecutiveHits = true;
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
        await createUserData(event.source.userId);
        break;
    }
  });

  response.status(200).send({});
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// webhookの署名検証
// https://developers.line.biz/ja/reference/messaging-api/#signature-validation
function verifySignature(body, receivedSignature, channelSecret) {
  const signature = crypto.createHmac("SHA256", channelSecret).update(body).digest("base64");
  return signature === receivedSignature;
}

async function createUserData(userId) {
  const userProfile = await client.getProfile(userId);
  db.writeUser(userId, userProfile.displayName, 0, 1, Enum.NONE);
}

async function setUserState(userId, newState) {
  const data = await db.readUser(userId);
  const n = data.name;
  const exp = data.exp;
  const level = data.level;

  db.writeUser(userId, n, exp, level, newState);
}

async function getUserState(userId) {
  const data = await db.readUser(userId);
  return data.state;
}

// U3ffeea449fc263a880fd0578aa9a4acf //泉

//リッチメニュー設定
let richMenuId = await lineApi.setRichMenu();
richMenuId = richMenuId.data.richMenuId;
await lineApi.uploadImage(richMenuId, "img/rich_menu.jpg");
await lineApi.setDefaultRichMenu(richMenuId);

async function sendInvitation() {
  const ids = await db.getUserIds();
  const currentDate = new Date();
  if (currentDate.getDay() == 5) {
    ids.forEach(async (id) => {
      await lineApi.pushMessage(id, "こんちゃーす。おいらふくゆきって言うんですけど、なんていうかその、最近あなたがあんまり構ってくれなくて、ちょっと寂しいんですよね。あのなんて言うか、全然強制するつもりはないんですけど、暇なんだったらおいらとディベートしてもらってもいいっすか？");
    });
  }
}

// 1時間ごとにgetCurrentTime関数を実行
const interval = 24 * 60 * 60 * 1000;
setInterval(sendInvitation, interval);

sendInvitation();
//await lineApi.pushFlexMessage("U3ffeea449fc263a880fd0578aa9a4acf");

