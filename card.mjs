import axios from "axios";
import { Client } from '@line/bot-sdk';
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

const client = new Client(config);

class Card {
  constructor(channelSecret) {
    this.api = new axios.create({
      baseURL: "https://api.line.me/v2",
      headers: {
        Authorization: `Bearer ${channelSecret}`,
        "Content-Type": "application/json",
      },
    });
  }

  async createCard(to) {
    let n = "Name";
    try {
      const userProfile = await client.getProfile(to);
      n = userProfile.displayName;
    } catch (error) {
      console.error('Error getting user profile:', error);
    }

    const jsonData = {
      "name": n,
      "exp": 0,
      "level": 1,
      "state": "NONE"
    };

    const jsonString = JSON.stringify(jsonData);

    fs.writeFile("data/" + to + ".json", jsonString, (err) => {
      if (err) {
        console.error('Error writing JSON file:', err);
      }
    });
  }

  async sendCard(to) {
    const data = JSON.parse(fs.readFileSync("data/" + to + ".json", "utf-8"));
    const n = data.name;
    const exp = data.exp;
    const state = data.state;

    const levelup = {
      1: 0,
      2: 1,
      3: 3,
      4: 6,
      5: 10,
      6: 15,
      7: 21,
      8: 28,
      9: 36,
      10: 45,
      11: 55,
      12: 66,
      13: 78,
      14: 91,
      15: 105,
      16: 120,
      17: 136,
      18: 153,
      19: 171,
      20: 190
    }

    let level = 1;
    for (let i = 1; i <= 20; i++) {
      if (exp >= levelup[i]) {
        level = i;
      }
    }

    let description = "レベルアップでクーポンをGET!!";
    if (level > 5) {
      description = "タップしてクーポンを発行!!";
    }

    const jsonData = {
      "name": n,
      "exp": exp,
      "level": level,
      "state": state
    };

    const jsonString = JSON.stringify(jsonData);

    fs.writeFile("data/" + to + ".json", jsonString, (err) => {
      if (err) {
        console.error('Error writing JSON file:', err);
      }
    });

    let ratio = (exp - levelup[level]) / (levelup[level + 1] - levelup[level]);
    //ratioが数値か確認
    if (isNaN(ratio)) {
      ratio = 1;
    }
    const body = {
      to,
      messages: [
        {
          "type": "flex",
          "altText": "This is a Flex Message",
          "contents":
          {
            "type": "bubble",
            "size": "giga",
            "direction": "ltr",
            "hero": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "box",
                  "layout": "horizontal",
                  "contents": [
                    {
                      "type": "text",
                      "text": n,
                      "color": "#ffffff",
                      "align": "start",
                      "size": "3xl",
                      "gravity": "top"
                    },
                    {
                      "type": "text",
                      "text": "Lv." + level,
                      "color": "#ffffff",
                      "align": "center",
                      "size": "3xl",
                      "gravity": "top"
                    }
                  ],
                  "height": "50px",
                  "offsetBottom": "12px"
                },
                {
                  "type": "box",
                  "layout": "vertical",
                  "contents": [
                    {
                      "type": "text",
                      "text": ratio * 100 + "%",
                      "color": "#ffffff",
                      "align": "start",
                      "size": "xxl",
                      "gravity": "center",
                      "margin": "lg",
                      "offsetTop": "5px"
                    },
                    {
                      "type": "box",
                      "layout": "vertical",
                      "contents": [
                        {
                          "type": "box",
                          "layout": "vertical",
                          "contents": [],
                          "width": ratio * 100 + "%",
                          "backgroundColor": "#11DD33",
                          "height": "8px",
                          "margin": "none"
                        }
                      ],
                      "backgroundColor": "#9FD8E36E",
                      "height": "8px",
                      "margin": "sm",
                      "offsetTop": "3px"
                    },
                    {
                      "type": "text",
                      "text": description,
                      "color": "#FAFAFA",
                      "size": "md",
                      "wrap": true,
                      "offsetTop": "7px"
                    }
                  ],
                  "height": "100px",
                  "offsetBottom": "18px"
                }
              ],
              "backgroundColor": "#27ACB2",
              "paddingTop": "19px",
              "paddingAll": "12px",
              "paddingBottom": "16px",
              "spacing": "none",
              "margin": "none",
              "height": "150px",
              "background": {
                "type": "linearGradient",
                "angle": "40deg",
                "startColor": "#03cffc",
                "endColor": "#fc03e3"
              },
              "action": {
                "type": "postback",
                "label": "action",
                "data": "card=1"
              }
            },
            "footer": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "product name",
                  "color": "#FFFFFF",
                  "size": "md",
                  "align": "end",
                  "gravity": "top",
                  "offsetBottom": "12px",
                  "offsetEnd": "228px"
                },
                {
                  "type": "image",
                  "url": "https://qr-official.line.me/sid/L/909hmssm.png",
                  "size": "28px",
                  "gravity": "top",
                  "align": "start",
                  "margin": "none",
                  "offsetBottom": "34px",
                  "offsetStart": "303px"
                }
              ],
              "backgroundColor": "#3f3f3f",
              "paddingTop": "19px",
              "paddingAll": "12px",
              "paddingBottom": "0px",
              "height": "40px"
            },
            "styles": {
              "header": {
                "separatorColor": "#FFFFFF"
              },
              "footer": {
                "separator": false,
                "backgroundColor": "#FFFFFF00"
              }
            }
          }
        }
      ]
    };
    return await this.api.post("/bot/message/push", body);
  }

  async sendCoupon(to) {
    const data = JSON.parse(fs.readFileSync("data/" + to + ".json", "utf-8"));
    const level = data.level;
    if (level > 5) {
      await this.pushMessage(to, "越前和紙のクーポンです。\nコピーして利用して下さい。\nXXXX-XXXX-XXXX");
    }
    if (level > 10) {
      await this.pushMessage(to, "若狭塗り箸のクーポンです。\nコピーして利用して下さい。\nXXXX-XXXX-XXXX");
    }
    if (level > 15) {
      await this.pushMessage(to, "越前打ち刃物のクーポンです。\nコピーして利用して下さい。\nXXXX-XXXX-XXXX");
    }
  }

  async pushMessage(to, messages) {
    const data = JSON.parse(fs.readFileSync("data/" + to + ".json", "utf-8"));


    const body = {
      to,
      messages: [
        {
          type: "text",
          text: messages,
        },
      ],
    };
    return await this.api.post("/bot/message/push", body);
  }

  async addExp(to, add) {
    const data = JSON.parse(fs.readFileSync("data/" + to + ".json", "utf-8"));
    const n = data.name;
    const exp = data.exp;
    const level = data.level;
    const state = data.state;

    const jsonData = {
      "name": n,
      "exp": exp + add,
      "level": level,
      "state": state
    };

    const jsonString = JSON.stringify(jsonData);

    fs.writeFile("data/" + to + ".json", jsonString, (err) => {
      if (err) {
        console.error('Error writing JSON file:', err);
      }
    });
  }
}

export { Card };
