import { JSDOM } from "jsdom";

const axios = require("axios");
const cheerio = require("cheerio");
import { Element } from "domhandler";

interface Link {
  text: string;
  url: string;
}

interface JsonNode {
  tag?: string;
  href?: string;
  texts?: string[];
  children?: JsonNode[];
}

class Html {
  private static processTree(
    root: JsonNode,
    predicate: any,
    action: any,
    repeat: boolean
  ) {
    let processNodes = (node: JsonNode, predicate: any) => {
      let nodesProcessed = 0;
      node.children?.forEach((child, index) => {
        if (predicate(child)) {
          nodesProcessed++;
          action(node, child, index);
        }
        nodesProcessed += processNodes(child, predicate);
      });
      return nodesProcessed;
    };
    if (repeat) while (processNodes(root, predicate));
    else processNodes(root, predicate);
  }

  static async fromUrl(url: string) {
    const headers = {
      // Set the preferred language to English
      "Accept-Language": "en-US,en;q=0.9",
    };
    const result = await axios.get(url, { headers });
    let data = result.data as any;
    if (typeof data !== "string") data = JSON.stringify(data);
    return data;
  }

  // Returns a JSON tree of the important nodes
  static getTree(html: string, condense: boolean): JsonNode {
    const uselessTags = [
      "head",
      "img",
      "script",
      "noscript",
      "link",
      "style",
      "object",
      "embed",
      "video",
      "audio",
      "iframe",
      "canvas",
      "svg",
      "input",
      "button",
      "select",
      "textarea",
    ];
    const uselessTagRegex = new RegExp(
      `<(?:${uselessTags.join("|")})\\b[^<]*(?:(?!<\\/(?:${uselessTags.join(
        "|"
      )}))<[^<]*)*<\\/\\s*(?:${uselessTags.join("|")})\\s*>`,
      "gi"
    );
    //html = html.replace(uselessTagRegex, "");

    const $ = cheerio.load(html);
    const root: JsonNode = { tag: "root", children: [] };

    const extractNode = (element: any): JsonNode | null => {
      if (element.type === "text") {
        // Text node
        if (!element.data.trimAll().length) return null;

        let texts = [(element as any).data.trimAll()].filter((s) => s?.length);
        const node: JsonNode = {};
        if (texts.length > 0) node.texts = texts;
        return node;
      } else if (element.type === "tag") {
        if (!element.name.trimAll().length) return null;
        const node: JsonNode = { tag: element.name, children: [] };

        // A tags, get the href
        if (element.name === "a") {
          const href = element.attribs.href;
          node.href = href;
        }

        const childElements = element.children.filter(
          (child: any) => child.type !== "comment"
        ) as Element[];

        if (childElements.length > 0) {
          node.children = childElements
            .map((child) => extractNode(child))
            .filter((node) => node !== null) as JsonNode[];
        }
        return node;
      } else {
        return null;
      }
    };

    const bodyElement = $("body")[0];
    if (bodyElement) {
      root.children = $(bodyElement)
        .get() // Use .get() to get the array of elements
        .map((el: Element) => extractNode(el))
        .filter((node: any) => node !== null) as JsonNode[];
    }

    if (!condense) return root;

    // Remove all nodes which have short texts
    Html.processTree(
      root,
      (node: any) => node.texts?.join("").length <= 1,
      (parent: any, node: any, index: number) => {
        parent.children?.splice(index, 1);
      },
      true
    );

    // Regex to test if a text starts with a html tag ('<')
    const tagRegex = /^<[^>]*>/;

    // Clear all texts that are html tags
    Html.processTree(
      root,
      // Node has texts
      (node: any) =>
        node.texts?.length > 0 &&
        // Any of the texts are html tags
        node.texts?.some((text: string) => tagRegex.test(text)),
      (parent: any, node: any, index: number) => {
        node.texts = node.texts.filter((text: string) => !tagRegex.test(text));
      },
      true
    );

    // Remove all nodes that are tag nodes and don't have children
    Html.processTree(
      root,
      (node: any) => node.children?.length === 0 && !node.texts?.length,
      (parent: any, node: any, index: number) => {
        parent.children?.splice(index, 1);
      },
      true
    );

    // Remove empty text nodes ({texts:[]})
    Html.processTree(
      root,
      (node: any) => "texts" in node && node.texts.length === 0,
      (parent: any, node: any, index: number) => {
        parent.children?.splice(index, 1);
      },
      true
    );

    // Condense empty chains of tag nodes (div > div > div > texts)
    // into a single node ("div.div.div" > texts)
    Html.processTree(
      root,
      (node: any) => node.tag && node.children?.length === 1,
      (parent: any, node: any, index: number) => {
        node.tag = `${node.tag}.${node.children[0].tag}`;
        node.texts = [...(node.texts || []), ...(node.children[0].texts || [])];
        node.children = node.children[0].children;
      },
      true
    );

    // Condense sibling texts nodes into a single node ([{texts:[...]}, {texts:[...]}, ...]) into a single node ({texts:[...,...]})
    Html.processTree(
      root,
      (node: any) =>
        // node has children
        node.children?.length > 1 &&
        // none of the child nodes have children
        !node.children.some((child: any) => child.children?.length) &&
        // any of the child nodes have texts
        node.children.some((child: any) => child.texts?.length),
      (parent: any, node: any, index: number) => {
        node.texts = node.children.map((child: any) => child.texts).flat();
        node.children = [];
      },
      false
    );

    return root;
  }

  static getAllTexts(
    node: JsonNode,
    minTextLength: number | null = null
  ): string[] {
    let texts = node.texts || [];
    if (minTextLength)
      texts = texts.filter((text) => text.length >= minTextLength);
    node.children?.forEach((child) =>
      texts.push(...Html.getAllTexts(child, minTextLength))
    );
    return texts;
  }

  static getAllLinks(node: JsonNode): Link[] {
    const links: Link[] = [];
    if (node.tag === "a" && node.href) {
      links.push({ text: Html.getNodeText(node), url: node.href });
    }
    node.children?.forEach((child) => links.push(...Html.getAllLinks(child)));
    return links;
  }

  static getNodeText(node: JsonNode): string {
    return Html.getAllTexts(node).join(" ");
  }
}

export { Html };
