import axios from "axios";

class Wiki {
  constructor(channelSecret) {
    this.api = new axios.create({
      baseURL: "https://api.line.me/v2",
      headers: {
        Authorization: `Bearer ${channelSecret}`,
        "Content-Type": "application/json",
      },
    });
  }

  async sendOptions(to) {
    const body = {
      to,
      messages: [
        {
          type: "text",
          text: "伝統工芸品WiKiです。\n見たい情報を選択して下さい。",
          "quickReply": { // 2
            "items": [
              {
                "type": "action", // 3
                "imageUrl": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Bookmark%20Tabs.png",
                "action": {
                  "type": "postback",
                  "label": "越前和紙",
                  "data": "wiki=1",
                }
              },
              {
                "type": "action",
                "imageUrl": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Chopsticks.png",
                "action": {
                  "type": "postback",
                  "label": "若狭塗り箸",
                  "data": "wiki=2",
                }
              },
              {
                "type": "action",
                "imageUrl": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Kitchen%20Knife.png",
                "action": {
                  "type": "postback",
                  "label": "越前打ち刃物",
                  "data": "wiki=3",
                }
              }
            ]
          }
        },
      ]
    };
    return await this.api.post("/bot/message/push", body);
  }

  async sendWiki(to, n) {
    let res = "aaa";
    switch (n) {
      case 1:
        await this.wiki1(to);
        break;
      case 2:
        await this.wiki2(to);
        break;
      case 3:
        await this.wiki3(to);
        break;
      default:
        break;
    }
  }

  async wiki1(to) {
    await this.pushMessage(to, "福井県の越前和紙は、日本国内外で高く評価されている伝統的な和紙の一種です。越前地方（福井県越前市および周辺地域）で生産され、その歴史は古く、約1500年以上の歴史を持つとされています。");
    await this.pushMessage(to, "特徴: \n1. 薄さと強度: 越前和紙は非常に薄く、透明感がありますが、同時に丈夫で強靭な特性を持っています。この特徴は、繊維の質と製造工程の精巧さによるものです。\n2. 美しい風合い: 越前和紙は手漉き製法で作られるため、風合いや質感に優れています。多様な柄や模様が描かれ、和紙ならではの美しさが楽しめます。\n3. 多様な用途: 越前和紙は、伝統的には書道や絵画、押し花などのアート作品に使用されてきましたが、近年では包装材やクラフト作品、インテリアデザインなど、幅広い分野で活用されています。");
    await this.pushMessage(to, "歴史: \n越前和紙の歴史は、奈良時代から始まります。当初は寺院で経典や仏画などを保護するために作られた和紙が起源です。その後、製紙技術が発展し、越前地方で独自の製紙方法が確立されました。江戸時代には、幕府によって越前和紙が褒美として贈られるなど、その品質と価値が広く認められました。");
    await this.pushMessage(to, "製造方法: \n1. 原料の準備: 主に楮（こうぞ）と呼ばれる植物の繊維を使用します。この繊維を収穫し、加工して和紙の原料とします。\n2. 繊維の漉き込み: 原料の繊維を水に溶かし、和紙の原形となる薄いシートを漉き込みます。これによって和紙の基盤ができます。\n3. 乾燥: 漉き込んだ和紙は、風や日光を利用して乾燥させます。この工程で和紙の強度が向上します。\n4. 加工と仕上げ: 乾燥した和紙を整え、必要に応じて色をつけたり、模様を描いたりします。さらに仕上げ工程を行い、最終的な製品が完成します。\n");
    await this.pushMessage(to, "越前和紙は、その美しさと品質の高さから、日本内外で高く評価されており、伝統工芸品として大切に守られています。");
  }

  async wiki2(to) {
    await this.pushMessage(to, "若狭塗り箸は、福井県の伝統的な工芸品の一つであり、美しい塗り絵と職人の技術が結集した箸です。");
    await this.pushMessage(to, "特徴: \n豊かな装飾: 若狭塗り箸は、彩り豊かな装飾が特徴です。箸の表面には、花鳥や風景など、様々なモチーフが繊細かつ美しく描かれています。これにより、単なる食器としての機能だけでなく、芸術的な要素も持ち合わせています。\n耐久性と使い心地: 若狭塗り箸は、塗りの技法によって箸の表面が保護されており、耐久性が高いです。また、手に馴染む形状や軽さも特徴であり、実用的な面でも優れています。\n伝統と革新の融合: 伝統的な技法を守りながらも、現代のデザインや需要に合わせて新しいスタイルの若狭塗り箸も制作されています。そのため、幅広い層の人々に愛されています。");
    await this.pushMessage(to, "歴史: \n若狭塗り箸の歴史は古く、江戸時代から続く伝統があります。福井県の若狭地方で塗り箸の制作が始まり、地域の豊かな自然や風物をモチーフにした装飾が展開されました。塗り箸は当初は日常使いの道具として作られましたが、次第にその美しさが評価され、贈り物やお土産としても広く用いられるようになりました。");
    await this.pushMessage(to, "製造方法: \n若狭塗り箸の製造は、主に以下の工程で行われます。\n木地の制作: 箸の形状を作るために木材を選び、削り出します。\n下塗り: 箸の表面に下塗りを施します。下塗りは、塗料が密着するための下地を作る工程です。\n描き込み: 繊細な筆使いで花鳥や風景などの模様を描き込みます。職人の技術がここで発揮されます。\n上塗りと仕上げ: 色とりどりの塗料を重ねて上塗りを行い、箸の表面を保護します。最終的に仕上げ工程で艶やかさを出します。");
    await this.pushMessage(to, "若狭塗り箸は、その美しさと伝統的な技術が評価され、日本国内外で愛されています。福井県の文化や職人の魂が息づくこの工芸品は、食卓を彩る一品として、長い歴史を背負いながらも未来に輝き続けています。");
  }

  async wiki3(to) {
    await this.pushMessage(to, "福井県の越前打ち刃物は、日本国内外で高く評価されている伝統的な刃物の一種です。越前地方（福井県越前市および周辺地域）で製造され、その歴史は古く、約700年以上の歴史を有しています。");
    await this.pushMessage(to, "特徴: \n1. 鋭利さと耐久性: 越前打ち刃物は、鋭利でありながらも優れた耐久性を持っています。これは、熟練した職人の手による打ち込み工程によって実現されます。\n2. 独自の模様: 打ち刃物の刃には、独自の模様があります。これは「地紋（じもん）」と呼ばれ、刃物ごとに異なる模様が打たれます。地紋は美しさだけでなく、刃物の個性を引き立てる要素でもあります。\n3. 使い込むほどの味わい: 越前打ち刃物は、使い込むほどに切れ味が増し、刃物との一体感が生まれます。長い間使い続けることで、愛着が深まる製品とされています。\n歴史: \n越前打ち刃物の歴史は、鎌倉時代に遡ります。当初は農具や道具の製作が中心でしたが、その後、刀や包丁などの刃物の制作が盛んになりました。江戸時代には、幕府によって越前打ち刃物が御用達とされ、その品質と切れ味が高く評価されました。");
    await this.pushMessage(to, "製造方法: \n越前打ち刃物の製造は、以下の主な工程で行われます。\n1. 鋼の準備: 刃物の刃に使用する高品質な鋼（たこう）を準備します。この鋼は刃物の性能に大きく影響を与えます。\n2. 刃の鍛造: 鋼を加熱して叩き、刃の形を整えます。この工程で鋼の結晶構造が整い、強度と切れ味が向上します。\n3. 地紋の打ち込み: 刃に独自の模様である地紋を打ち込みます。職人の技術と創造力が発揮される重要な工程です。\n4. 研磨と仕上げ: 打ち込んだ刃を研磨し、切れ味を最高レベルに仕上げます。同時に刃物全体の美しさも整えられます。");
    await this.pushMessage(to, "越前打ち刃物は、その品質と独自の技術によって、刃物愛好家やプロの料理人から高く評価されています。伝統を受け継ぎながらも、現代のニーズに合わせた刃物も製造され、福井県の誇るべき伝統工芸品として脈々と受け継がれています。");
  }

  async pushMessage(to, messages) {
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
}
export { Wiki };
