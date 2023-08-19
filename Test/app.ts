const util = require("util");
import path from "path";
import fs from "fs";
import "colors";
import axios from "axios";
import "@shared/Extensions";
import { Http } from "@shared/Http";
import { Timer } from "@shared/Timer";
import { Objects } from "@shared/Extensions.Objects";
import { Configuration } from "@shared/Configuration";
import { Logger } from "@shared/Logger";
import { Files } from "@shared/Files";
import { Progress } from "@shared/Progress";
import { Database } from "@shared/Database/Database";
import { Analytics, ItemType } from "@shared/Analytics";
import { TreeScript } from "@shared/TreeScript/TreeScript";
import { Apify } from "@shared/Apify";
import { Console } from "@shared/Console";
import { ChatOpenAI, Roles } from "../Apis/OpenAI/classes/ChatOpenAI";
import { Model } from "../Apis/OpenAI/classes/OpenAI";
import { Google } from "@shared/Google";
import { Coder } from "@shared/Coder";
import { Cache } from "@shared/Cache";
import { LiveTree } from "@shared/LiveTree";

type malkovich = string;

class Malkovich {
  async malkovich(malkovich: malkovich) {
    // Wait 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Malkovich".green);
  }
}

const malkovitch = new Malkovich();

function removeQuoteLinks(s: string) {
  return s.replace(/<a href=".*?" class="quotelink">.*?<\/a>/g, "");
}

(async () => {
  interface TreeNode {
    item: {
      type: string;
      key?: string;
      value?: any;
    };
    children?: TreeNode[];
  }

  function getTypeName(value: any) {
    if (Array.isArray(value)) return "array";
    if (value != null && typeof value == "object") return "object";
    return typeof value;
  }

  function hasChildItems(value: any) {
    return !["array", "object"].includes(getTypeName(value));
  }

  function toItem(value: any) {
    if (!hasChildItems(value)) {
      return {
        type: "value",
        value: value,
      };
    }
    return {
      type: getTypeName(value),
    };
  }

  function getChildren(inputObj: any): TreeNode[] | undefined {
    if (typeof inputObj === "object" && inputObj !== null) {
      if (Array.isArray(inputObj)) {
        return inputObj.map((item) => ({
          item: toItem(item),
          children: getChildren(item),
        }));
      } else {
        const entries = Object.entries(inputObj);
        const primitiveEntries = entries.filter(
          ([key, value]) => !hasChildItems(value)
        );
        const complexEntries = entries.filter(([key, value]) =>
          hasChildItems(value)
        );
        return complexEntries.map(([childKey, childValue]) => ({
          item: {
            type: "entry",
            key: childKey,
            value: typeof childValue === "object" ? undefined : childValue,
          },
          children: getChildren(childValue),
        }));
      }
    }
    return undefined;
  }

  function convertToTree(inputObj: any, key: string | null = null): TreeNode {
    const node: TreeNode = {
      item: {
        type: Array.isArray(inputObj)
          ? "array"
          : typeof inputObj === "object"
          ? "object"
          : "value",
      },
      children: getChildren(inputObj),
    };

    if (key) {
      node.item.key = key;
    }

    return node;
  }

  // Example input object
  const inputObj = {
    numberValue: 42,
    stringValue: "Hello, world!",
    booleanValue: true,
    nullValue: null,
    arrayValue: [1, 2, { a: 1 }],
    objectValue: {
      nestedNumber: 123,
      nestedString: "Nested string",
    },
  };

  const tree = convertToTree(inputObj, null);
  console.log(JSON.stringify(tree, null, 2));
})();
