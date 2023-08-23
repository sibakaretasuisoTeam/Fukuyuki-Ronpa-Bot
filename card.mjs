import axios from "axios";

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

  async sendCard(to) {
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
                      "text": "Name",
                      "color": "#ffffff",
                      "align": "start",
                      "size": "3xl",
                      "gravity": "top"
                    },
                    {
                      "type": "text",
                      "text": "Lv.1",
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
                      "text": "50%",
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
                          "width": "50%",
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
                      "text": "レベルアップでクーポンGET!",
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
              }
            },
            "footer": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "それって福井のお宝ですよね？",
                  "color": "#ffffff",
                  "size": "md",
                  "offsetBottom": "14px"
                },
                {
                  "type": "image",
                  "url": "https://qr-official.line.me/sid/L/909hmssm.png",
                  "size": "30px",
                  "offsetBottom": "39px",
                  "offsetStart": "173px"
                }
              ],
              "backgroundColor": "#3f3f3f",
              "paddingTop": "19px",
              "paddingAll": "12px",
              "paddingBottom": "16px",
              "spacing": "none",
              "margin": "none",
              "height": "15px"
            },
            "styles": {
              "header": {
                "separatorColor": "#FFFFFF"
              },
              "footer": {
                "separator": false
              }
            }
          }
        }
      ]
    };
    return await this.api.post("/bot/message/push", body);
  }
}

export { Card };
