const util = require("util");
import path from "path";
import fs from "fs";
import "colors";
import * as moment from "moment";
import axios from "axios";
import "@shared/Extensions";
import { Timer } from "@shared/Timer";
import { Objects } from "@shared/Extensions.Objects";
import { Configuration } from "@shared/Configuration";
import { Logger } from "@shared/Logger";
import { Files } from "@shared/Files";
import { Progress } from "@shared/Progress";
import { Database } from "@shared/Database/Database";
import { Analytics } from "@shared/Analytics";
import { TreeScript } from "@shared/TreeScript/TreeScript";
import { Apify } from "@shared/Apify";
import { Console } from "@shared/Console";
import { ChatOpenAI, Roles } from "../Apis/OpenAI/classes/ChatOpenAI";
import { Google } from "@shared/Google";
import { Coder } from "@shared/Coder";
import { Cache } from "@shared/Cache";

type malkovich = string;

class Malkovich {
  async malkovich(malkovich: malkovich) {
    // Wait 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Malkovich".green);
  }
}

const malkovitch = new Malkovich();

(async () => {
  const obj1 = {
    _id: 25676,
    name: "Demo.Counter",
    options: {
      debug: false,
    },
    methods: [
      {
        id: 3299873,
        args: null,
        name: "onClick",
        body: "this.clicked++;",
        code: {
          debugInBrowser: false,
        },
        options: {
          cache: {},
          rateLimit: {
            enabled: false,
            delay: 400,
          },
        },
        errors: [],
      },
    ],
    props: [
      {
        rateLimit: {
          enabled: false,
          type: "RateLimit",
          value: null,
        },
        errors: [],
        settings: {
          valueView: {},
        },
        routeParam: {
          enabled: false,
        },
        id: 3299874,
        type: null,
        name: "clicked",
        default: {
          enabled: true,
          value: 0,
        },
        example: {
          enabled: false,
          value: null,
        },
        props: {
          enabled: false,
        },
        watch: {
          enabled: false,
          method: {
            args: "newClicked, oldClicked",
            body: "",
          },
          deep: false,
          immediate: false,
        },
        computed: {
          enabled: false,
          get: {
            type: "method",
            body: "",
          },
          set: {
            type: "method",
            args: "newClicked",
            body: "",
          },
        },
        persisted: {
          enabled: false,
          load: {
            type: "method",
            body: "",
          },
          save: {
            type: "method",
            args: "newClicked",
            body: "",
          },
        },
      },
    ],
    styles: [
      {
        name: "default",
        css: null,
      },
    ],
    view: {
      node: {
        enabled: true,
        path: [0],
        type: "tag",
        tag: "div",
        attrs: [],
        children: [
          {
            node: {
              id: 3299876,
              type: "tag",
              enabled: true,
              tag: "div",
              nodeComp: null,
              attrs: [
                {
                  name: "class",
                  value: "flex justify-around p-l5 bg-gray-40",
                  enabled: true,
                  bind: false,
                  id: 3762331,
                },
              ],
              children: [
                {
                  node: {
                    id: 3299877,
                    type: "tag",
                    enabled: true,
                    tag: "button",
                    nodeComp: null,
                    attrs: [
                      {
                        name: "class",
                        value: "",
                        enabled: true,
                        bind: false,
                        id: 3762332,
                      },
                      {
                        id: 3762333,
                        name: "v-text",
                        value: "`Clicked ${clicked} times`",
                        enabled: true,
                        bind: false,
                      },
                      {
                        id: 3762334,
                        name: "@click",
                        value: "onClick",
                        enabled: true,
                        bind: false,
                      },
                    ],
                    children: [],
                    path: [0, 0, 0],
                    treeIndex: 2,
                  },
                },
              ],
              path: [0, 0],
              treeIndex: 1,
              expanded: true,
            },
          },
        ],
        id: 3299875,
        treeIndex: 0,
        expanded: true,
      },
      errors: [],
    },
    permissions: {
      list: {
        default: ["*"],
      },
    },
    user: {
      _id: 47446,
    },
    created: 1660047146138,
    last: {
      updated: 1680391305271,
    },
    data: {
      _id: 1,
      type: null,
      ip: 2,
      created: 1657435890672,
      dbChange: {
        _id: 132427,
      },
      data: {
        componentClasses: {
          _ids: [
            121, 129, 130, 131, 132, 133, 138, 140, 144, 145, 146, 147, 152,
            153, 154, 158, 159, 160, 161, 163, 167, 169, 171, 172, 174, 175,
            176, 178, 179, 182, 184, 186, 190, 194, 195, 196, 197, 207, 209,
            210, 213, 214, 232, 236, 241, 243, 249, 251, 252, 253, 254, 255,
            267, 268, 286, 289, 290, 322, 350, 351, 352, 355, 365, 366, 367,
            370, 371, 373, 374, 375, 376, 378, 379, 380, 382, 383, 384, 385,
            387, 388, 389, 392, 393, 394, 395, 397, 398, 399, 8043, 11615,
            11796, 15074, 17442, 17657, 18841, 18917, 19494, 24461, 24462,
            24465, 24567, 24568, 24569, 24571, 24577, 24578, 24579, 24580,
            24581, 24582, 24677, 24678, 24680, 24771, 24772, 24773, 24774,
            24820, 24821, 25335, 25336, 25337, 25339, 25340, 25341, 25342,
            25343, 25344, 25356, 25358, 25359, 25361, 25372, 25373, 25374,
            25375, 25376, 25377, 25378, 25379, 25380, 25381, 25382, 25383,
            25384, 25385, 25386, 25387, 25388, 25394, 25395, 25396, 25400,
            25402, 25403, 25404, 25405, 25407, 25408, 25409, 25410, 25411,
            25412, 25413, 25414, 25415, 25416, 25417, 25467, 25468, 25469,
            25470, 25472, 25473, 25474, 25475, 25476, 25477, 25478, 25479,
            25480, 25481, 25482, 25483, 25484, 25485, 25486, 25487, 25488,
            25489, 25490, 25491, 25492, 25493, 25495, 25496, 25497, 25498,
            25499, 25500, 25501, 25502, 25503, 25504, 25505, 25506, 25507,
            25508, 25509, 25510, 25511, 25512, 25513, 25514, 25515, 25516,
            25517, 25518, 25519, 25520, 25521, 25522, 25523, 25524, 25526,
            25527, 25528, 25529, 25530, 25531, 25532, 25533, 25534, 25535,
            25536, 25537, 25538, 25539, 25540, 25541, 25542, 25543, 25544,
            25545, 25546, 25547, 25548, 25549, 25550, 25552, 25553, 25554,
            25555, 25556, 25557, 25558, 25559, 25560, 25561, 25562, 25563,
            25564, 25565, 25566, 25572, 25573, 25574, 25575, 25576, 25577,
            25578, 25579, 25580, 25581, 25582, 25583, 25584, 25585, 25586,
            25587, 25588, 25589, 25590, 25591, 25592, 25593, 25594, 25595,
            25635, 25636, 25637, 25638, 25639, 25640, 25641, 25642, 25643,
            25644, 25645, 25646, 25647, 25648, 25649, 25650, 25651, 25652,
            25653, 25654, 25656, 25658, 25659, 25660, 25661, 25662, 25663,
            25664, 25665, 25666, 25676, 25717,
          ],
        },
      },
      last: {
        updated: 1680340207913,
      },
      google: {
        iss: "https://accounts.google.com",
        nbf: 1659597925,
        aud: "3680328427-kaad8n5b808er5sgt3ieqdpu3sgde8p6.apps.googleusercontent.com",
        sub: "111435712013566093033",
        email: "ferenc.somos@gmail.com",
        email_verified: true,
        azp: "3680328427-kaad8n5b808er5sgt3ieqdpu3sgde8p6.apps.googleusercontent.com",
        name: "Eff Francis",
        picture:
          "https://lh3.googleusercontent.com/a-/AFdZucoBnCzdTagYe0oISN3lFHiDpXDhvQMO0vcMVpCj5w=s96-c",
        given_name: "Eff",
        family_name: "Francis",
        iat: 1659598225,
        exp: 1659601825,
        jti: "6310faab7f6234f3b537747b8b22001f13406d52",
      },
      info: {
        image:
          "https://lh3.googleusercontent.com/a-/AFdZucoBnCzdTagYe0oISN3lFHiDpXDhvQMO0vcMVpCj5w=s96-c",
        name: "Eff",
      },
      test: "aa",
    },
  };

  const obj2 = Objects.clone(obj1);
  obj2.methods[0].body = "alertify.message(this.clicked.toString());";

  const diff = Objects.deepDiff(obj1, obj2);

  console.log(diff);

  // const debugLogger = Logger.new({
  //   path: `c:\\eff\\Development\\Logs\\${new Date()
  //     .toLocaleString()
  //     .sanitizePath()}.log`,
  // });

  // await debugLogger.log("test");

  // const tsCode = Coder.App.addDebuggingCode(
  //   path.resolve(`../Apps/DatabaseProxy/Server/app.ts`)
  // );

  // fs.writeFileSync(
  //   path.resolve(path.dirname(process.argv[1]), "test.ts"),
  //   tsCode
  // );

  process.exit();

  // const url = `https://db.memegenerator.net/MemeGenerator`;
  // //const url = `https://memegenerator.net/api/client.js`;

  // for (let i = 0; i < 100; i++) {
  //   try {
  //     const timer = Timer.start();
  //     const response = await axios.get(url);
  //     console.log(
  //       `${response.status.severifyByHttpStatus()} ${timer.elapsed
  //         ?.unitifyTime()
  //         .padStart(6)} ${response.data.length
  //         .unitifySize()
  //         .padStart(6)} ${url}`
  //     );
  //   } catch (ex: any) {
  //     console.log(ex.message.bgRed);
  //   }
  // }

  // process.exit();

  // const db = await Database.new({ path: "C:\\Database\\Cache\\Test" });

  // const doc = { TestKey: "TestValue" };

  // await db.upsert("TestCollection", doc);

  // await db.set("TestKey", doc);

  // console.log(doc);

  // process.exit();

  // const config = (await Configuration.new()).data;

  // const cache = await Cache.new(config.cache);

  // const value = await cache.get("test key 1", () => "test value 1");

  // console.log(value);
})();

// for (var i = 0; i <= 100; i += 10) {
//   const percent = i / 100;
//   const value = i * 1000;
//   //console.log(value.unitifyTime(), value.unitifyTime().deunitifyTime());

//   console.log(
//     percent.unitifyPercent(),
//     percent.unitifyPercent().severify(0.9, 0.8, ">")
//   );
// }

// const progress = Progress.newAutoDisplay(100, { skipped: 0, modifieds: [] });

// (async () => {
//   for (let i = 0; i < 100; i++) {
//     progress.increment();
//     await new Promise((resolve) => setTimeout(resolve, 100));
//   }
// })();

// const path1 = `C:\\eff\\Development\\${
//   `Projects`.green
// }\\MemeGenerator\\MG2.Website\\Node1\\`;

// console.log(path1.splitOnWidth(22).join("\n"));

// process.exit();

// (async () => {
//   Files.watch(
//     [path1],
//     { recursive: true, exclude: ["node_modules"] },
//     (paths) => {
//       console.log(paths);
//     },
//     (message) => console.log(message)
//   );
// })();

// (async () => {
//   //const configPath = `../Apps/DatabaseProxy/Server/config.yaml`;
//   const configPath = `./config.yaml`;

//   const config = (await Configuration.new({}, configPath)).data;

//   //const db = await Database.newDb(config.database);

//   const analytics = await Analytics.new(await Database.new(config.database));

//   await analytics.create("category", "event", { value: 1 });

//   console.log(`test string`.bgRed);
// })();

// const tsSourcePath = path.resolve(
//   __dirname,
//   "../Shared/TreeScript/test.ts.yaml"
// );

// const source = fs.readFileSync(tsSourcePath, "utf8");
// const trs = TreeScript.new(source);

// console.log(tsSourcePath.toShortPath());
// console.log();

// console.log(trs.output);

// process.exit();

// (async () => {
//   const chat = await ChatOpenAI.new(Roles.ChatGPT, true);

//   const reply = await chat.send("Hello, how are you?");
// })();
