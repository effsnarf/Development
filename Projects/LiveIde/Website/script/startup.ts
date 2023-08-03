import "../../../../Shared/Extensions";
import { Component } from "../../classes/Component";
import { Objects } from "../../../../Shared/Extensions.Objects.Client";
import { TaskQueue } from "../../../../Shared/TaskQueue";
import { StateTracker } from "../../classes/StateTracker";
import { AnalyticsTracker } from "../../classes/AnalyticsTracker";
import { ClientContext } from "../../classes/ClientContext";
import { Params } from "../../classes/Params";
import { DatabaseProxy } from "../../../../Apps/DatabaseProxy/Client/DbpClient";
import { VueManager } from "../../classes/VueManager";
import addPaths from "../../../../Shared/WebScript/add.paths";
import { resolve } from "path";

// To make it accessible to client code
const win = window as any;
win.Objects = Objects;
win.TaskQueue = TaskQueue;

const htmlEncode = (s: string) => {
  if (!s) return null;
  // HTML encode
  s = s.replace(/&/g, "&amp;");
  s = s.replace(/</g, "&lt;");
  s = s.replace(/>/g, "&gt;");
  s = s.replace(/"/g, "&quot;");
  s = s.replace(/'/g, "&#39;");
  return s;
};

const helpers = {
  url: {
    thread: (thread: any, full: boolean = false) => {
      if (!thread) return null;
      return helpers.url.full(`/t/${thread._id}`, full);
    },
    builder: (builder: any, full: boolean = false) => {
      if (!builder) return null;
      return helpers.url.full(`/b/${builder.urlName}`, full);
    },
    media: (media: any, full: boolean = false) => {
      if (!media) return null;
      return helpers.url.full(`/m/${media._id}`, full);
    },
    generator: (generator: any, full: boolean = false) => {
      if (!generator) return null;
      return helpers.url.full(`/${generator.urlName}`, full);
    },
    instance: (instance: any, full: boolean = false) => {
      if (!instance?.instanceID) return null;
      return helpers.url.full(`/instance/${instance.instanceID}`, full);
    },
    itemImage: (item: any) => {
      if (!item) return null;
      if ("text0" in item) {
        if (!item._id) return `/img/empty.png`;
        return `https://img.memegenerator.net/instances/600x600/${item._id}.jpg`;
      }
      if (item.type == "builder" && item.content?.item) {
        const getImageID = (item: any) => {
          const imageIDs = [] as number[];
          Objects.traverse(item, (node: any, key: string, value: any) => {
            if (key == "imageID") imageIDs.push(value);
          });
          return imageIDs[0];
        };
        const imageID = getImageID(item.content.item);
        return helpers.url.image(imageID);
      }

      const imageNode = Objects.traverseMap(item).find(
        (a) => a.key == "imageID"
      );
      if (imageNode) return helpers.url.image(imageNode.value);

      console.log(item);
      throw new Error("Unknown item type");
    },
    image: (
      imageID: number,
      full: boolean = false,
      removeBackground: boolean = false
    ) => {
      if (!imageID) return null;
      const noBg = removeBackground ? ".nobg" : "";
      return helpers.url.full(
        `https://img.memegenerator.net/images/${imageID}${noBg}.jpg`,
        full
      );
    },
    item: (item: any, full: boolean = false) => {
      if (!item) return null;
      if (item.builderID) return helpers.url.media(item, full);
      if ("text0" in item) return helpers.url.instance(item, full);
      if (item.format) return helpers.url.builder(item, full);
      if (item.displayName) return helpers.url.generator(item, full);
      throw new Error("Unknown item type");
    },
    full: (path: string, full: boolean = false) => {
      if (!path) return null;
      if (path.startsWith("http")) return path;
      if (full) return `https://memegenerator.net${path}`;
      return path;
    },
  },
  html: {
    getAppliedStyles: (element: HTMLElement) => {
      if (!element) return [];

      // Create a temporary element to get default styles
      const tempElement = document.createElement(element.tagName);

      // Add the temporary element off-screen
      tempElement.style.position = "absolute";
      tempElement.style.left = "-9999px";
      document.body.appendChild(tempElement);

      // Get computed styles of the temporary element
      const defaultStyles = window.getComputedStyle(tempElement) as any;

      // Get computed styles of the target element
      const computedStyles = window.getComputedStyle(element);

      // Object to store non-default styles
      const nonDefaultStyles = {} as any;

      // Compare styles to find non-default properties
      for (const prop of defaultStyles) {
        if (defaultStyles[prop] !== computedStyles[prop]) {
          nonDefaultStyles[prop] = computedStyles[prop];
        }
      }

      // Clean up - remove the temporary element
      document.body.removeChild(tempElement);

      return Object.entries(nonDefaultStyles)
        .filter((e) => !e[0].startsWith("border-"))
        .map((e) => {
          return { name: e[0], value: e[1] };
        });
    },
    cssProperties: {
      "align-content": {
        moz: false,
        webkit: true,
        syntax:
          "(stretch)|(center)|(flex-start)|(flex-end)|(space-between)|(space-around)|(initial)|(inherit)",
        initial: "stretch",
        values: [
          "stretch",
          "center",
          "flex-start",
          "flex-end",
          "space-between",
          "space-around",
          "initial",
          "inherit",
        ],
      },
      "align-items": {
        moz: false,
        webkit: true,
        syntax:
          "(stretch)|(center)|(flex-start)|(flex-end)|(baseline)|(initial)|(inherit)",
        initial: "stretch",
        values: [
          "stretch",
          "center",
          "flex-start",
          "flex-end",
          "baseline",
          "initial",
          "inherit",
        ],
      },
      "align-self": {
        moz: false,
        webkit: true,
        syntax:
          "(auto)|(stretch)|(center)|(flex-start)|(flex-end)|(baseline)|(initial)|(inherit)",
        initial: "auto",
        values: [
          "auto",
          "stretch",
          "center",
          "flex-start",
          "flex-end",
          "baseline",
          "initial",
          "inherit",
        ],
      },
      all: {
        moz: false,
        webkit: false,
        syntax: "(initial)|(inherit)|(unset)",
        initial: "none",
        values: ["initial", "inherit", "unset"],
      },
      animation: {
        moz: true,
        webkit: true,
        syntax:
          "(([prop:animation-name]) ([prop:animation-duration]) ([prop:animation-timing-function]) ([prop:animation-delay]) ([prop:animation-iteration-count]) ([prop:animation-direction]) ([prop:animation-fill-mode]) ([prop:animation-play-state]))|(initial)|(inherit)",
        initial: "none 0 ease 0 1 normal none running",
        values: [
          "[prop:animation-name]",
          "[prop:animation-duration]",
          "[prop:animation-timing-function]",
          "[prop:animation-delay]",
          "[prop:animation-iteration-count]",
          "[prop:animation-direction]",
          "[prop:animation-fill-mode]",
          "[prop:animation-play-state]",
          "initial",
          "inherit",
        ],
      },
      "animation-delay": {
        moz: true,
        webkit: true,
        syntax: "([time])|(initial)|(inherit)",
        initial: "0s",
        values: ["[time]", "initial", "inherit"],
      },
      "animation-direction": {
        moz: true,
        webkit: true,
        syntax:
          "(normal)|(reverse)|(alternate)|(alternate-reverse)|(initial)|(inherit)",
        initial: "normal",
        values: [
          "normal",
          "reverse",
          "alternate",
          "alternate-reverse",
          "initial",
          "inherit",
        ],
      },
      "animation-duration": {
        moz: true,
        webkit: true,
        syntax: "([time])|(initial)|(inherit)",
        initial: "0",
        values: ["[time]", "initial", "inherit"],
      },
      "animation-fill-mode": {
        moz: true,
        webkit: true,
        syntax: "(none)|(forwards)|(backwards)|(both)|(initial)|(inherit)",
        initial: "none",
        values: ["none", "forwards", "backwards", "both", "initial", "inherit"],
      },
      "animation-iteration-count": {
        moz: true,
        webkit: true,
        syntax: "([number])|(infinite)|(initial)|(inherit)",
        initial: "1",
        values: ["[number]", "infinite", "initial", "inherit"],
      },
      "animation-name": {
        moz: true,
        webkit: true,
        syntax: "([label])|(none)|(initial)|(inherit)",
        initial: "none",
        values: ["[label]", "none", "initial", "inherit"],
      },
      "animation-play-state": {
        moz: true,
        webkit: true,
        syntax: "(paused)|(running)|(initial)|(inherit)",
        initial: "running",
        values: ["paused", "running", "initial", "inherit"],
      },
      "animation-timing-function": {
        moz: true,
        webkit: true,
        syntax:
          "(linear)|(ease)|(ease-in)|(ease-out)|(ease-in-out)|(step-start)|(step-end)|([steps])|[cubic-bezier]|(initial)|(inherit)",
        initial: "ease",
        values: [
          "linear",
          "ease",
          "ease-in",
          "ease-out",
          "ease-in-out",
          "step-start",
          "step-end",
          "[steps]",
          "cubic-bezier",
          "initial",
          "inherit",
        ],
      },
      "backface-visibility": {
        moz: true,
        webkit: true,
        syntax: "(visible)|(hidden)|(initial)|(inherit)",
        initial: "visible",
        values: ["visible", "hidden", "initial", "inherit"],
      },
      background: {
        moz: false,
        webkit: false,
        syntax:
          "(([prop:background-color]) ([prop:background-image]) ((([prop:background-position])|([prop:background-size]))) ([prop:background-repeat]) ([prop:background-origin]) ([prop:background-clip]) ([prop:background-attachment]))|(initial)|(inherit)",
        initial: "see individual properties",
        values: [
          "[prop:background-color]",
          "[prop:background-image]",
          "[prop:background-position]",
          "[prop:background-size]",
          "[prop:background-repeat]",
          "[prop:background-origin]",
          "[prop:background-clip]",
          "[prop:background-attachment]",
          "initial",
          "inherit",
        ],
      },
      "background-attachment": {
        moz: false,
        webkit: false,
        syntax: "(scroll)|(fixed)|(local)|(initial)|(inherit)",
        initial: "scroll",
        values: ["scroll", "fixed", "local", "initial", "inherit"],
      },
      "background-blend-mode": {
        moz: false,
        webkit: false,
        syntax:
          "(normal)|(multiply)|(screen)|(overlay)|(darken)|(lighten)|(color-dodge)|(saturation)|([color])|(luminosity)",
        initial: "normal",
        values: [
          "normal",
          "multiply",
          "screen",
          "overlay",
          "darken",
          "lighten",
          "color-dodge",
          "saturation",
          "[color]",
          "luminosity",
        ],
      },
      "background-clip": {
        moz: false,
        webkit: false,
        syntax: "(border-box)|(padding-box)|(content-box)|(initial)|(inherit)",
        initial: "border-box",
        values: [
          "border-box",
          "padding-box",
          "content-box",
          "initial",
          "inherit",
        ],
      },
      "background-color": {
        moz: false,
        webkit: false,
        syntax: "([color])|(transparent)|(initial)|(inherit)",
        initial: "transparent",
        values: ["[color]", "transparent", "initial", "inherit"],
      },
      "background-image": {
        moz: false,
        webkit: false,
        syntax:
          "([fn:url])|([fn:linear-gradient])|([fn:radial-gradient])|([fn:repeating-linear-gradient])|([fn:repeating-radial-gradient])|(none)|(initial)|(inherit)",
        initial: "none",
        values: [
          "[fn:url]",
          "none",
          "[fn:linear-gradient]",
          "[fn:radial-gradient]",
          "[fn:repeating-linear-gradient]",
          "[fn:repeating-radial-gradient]",
          "initial",
          "inherit",
        ],
      },
      "background-origin": {
        moz: false,
        webkit: false,
        syntax: "(padding-box)|(border-box)|(content-box)|(initial)|(inherit)",
        initial: "padding-box",
        values: [
          "padding-box",
          "border-box",
          "content-box",
          "initial",
          "inherit",
        ],
      },
      "background-position": {
        moz: false,
        webkit: false,
        syntax:
          "(left top)|(left center)|(left bottom)|(right top)|(right center)|(right bottom)|(center top)|(center center)|(center bottom)|([percent]){2,2}|([length]){2,2}|(initial)|(inherit)",
        initial: "0% 0%",
        values: [
          "left top",
          "left center",
          "left bottom",
          "right top",
          "right center",
          "right bottom",
          "center top",
          "center center",
          "center bottom",
          "([percent]){2,2}",
          "([length]){2,2}",
          "initial",
          "inherit",
        ],
      },
      "background-repeat": {
        moz: false,
        webkit: false,
        syntax:
          "(repeat)|(repeat-x)|(repeat-y)|(no-repeat)|(initial)|(inherit)",
        initial: "repeat",
        values: [
          "repeat",
          "repeat-x",
          "repeat-y",
          "no-repeat",
          "space",
          "round",
          "initial",
          "inherit",
        ],
      },
      "background-size": {
        moz: true,
        webkit: true,
        syntax: "(auto)|([length])|(cover)|(contain)|(initial)|(inherit)",
        initial: "auto",
        values: [
          "auto",
          "[length]",
          "percentage",
          "cover",
          "contain",
          "initial",
          "inherit",
        ],
      },
      border: {
        moz: false,
        webkit: false,
        syntax:
          "(([prop:border-width]) ([prop:border-style]) ([prop:border-color]))|(initial)|(inherit)",
        initial: "medium none color",
        values: [
          "[prop:border-width]",
          "[prop:border-style]",
          "[prop:border-color]",
          "initial",
          "inherit",
        ],
      },
      "border-bottom": {
        moz: false,
        webkit: false,
        syntax:
          "([prop:border-bottom-width]) ([prop:border-bottom-style]) ([prop:border-bottom-color])|(initial)|(inherit)",
        initial: "medium none color",
        values: [
          "[prop:border-bottom-width]",
          "[prop:border-bottom-style]",
          "[prop:border-bottom-color]",
          "initial",
          "inherit",
        ],
      },
      "border-bottom-color": {
        moz: false,
        webkit: false,
        syntax: "([color])|(transparent)|(initial)|(inherit)",
        initial: "The current color of the element",
        values: ["[color]", "transparent", "initial", "inherit"],
      },
      "border-bottom-left-radius": {
        moz: true,
        webkit: true,
        syntax: "(([length])|([percent])){1,2}|(initial)|(inherit)",
        initial: "0",
        values: ["[length]", "[percent]", "initial", "inherit"],
      },
      "border-bottom-right-radius": {
        moz: true,
        webkit: true,
        syntax: "(([length])|([percent])){1,2}|(initial)|(inherit)",
        initial: "0",
        values: ["[length]", "[percent]", "initial", "inherit"],
      },
      "border-bottom-style": {
        moz: false,
        webkit: false,
        syntax:
          "(none)|(hidden)|(dotted)|(dashed)|(solid)|(double)|(groove)|(ridge)|(inset)|(outset)|(initial)|(inherit)",
        initial: "none",
        values: [
          "none",
          "hidden",
          "dotted",
          "dashed",
          "solid",
          "double",
          "groove",
          "ridge",
          "inset",
          "outset",
          "initial",
          "inherit",
        ],
      },
      "border-bottom-width": {
        moz: false,
        webkit: false,
        syntax: "(medium)|(thin)|(thick)|([length])|(initial)|(inherit)",
        initial: "medium",
        values: ["medium", "thin", "thick", "[length]", "initial", "inherit"],
      },
      "border-collapse": {
        moz: false,
        webkit: false,
        syntax: "(separate)|(collapse)|(initial)|(inherit)",
        initial: "separate",
        values: ["separate", "collapse", "initial", "inherit"],
      },
      "border-color": {
        moz: false,
        webkit: false,
        syntax: "([color])|(transparent)|(initial)|(inherit)",
        initial: "The current color of the element",
        values: ["[color]", "transparent", "initial", "inherit"],
      },
      "border-image": {
        moz: true,
        webkit: true,
        syntax:
          "(([prop:border-image-source]) ([prop:border-image-slice]) ([prop:border-image-width]) ([prop:border-image-outset]) ([prop:border-image-repeat]))|(initial)|(inherit)",
        initial: "none 100% 1 0 stretch",
        values: [
          "[prop:border-image-source]",
          "[prop:border-image-slice]",
          "[prop:border-image-width]",
          "[prop:border-image-outset]",
          "[prop:border-image-repeat]",
          "initial",
          "inherit",
        ],
      },
      "border-image-outset": {
        moz: false,
        webkit: false,
        syntax: "([length])|([number])|(initial)|(inherit)",
        initial: "0",
        values: ["[length]", "[number]", "initial", "inherit"],
      },
      "border-image-repeat": {
        moz: false,
        webkit: false,
        syntax: "(stretch)|(repeat)|(round)|(initial)|(inherit)",
        initial: "stretch",
        values: ["stretch", "repeat", "round", "space", "initial", "inherit"],
      },
      "border-image-slice": {
        moz: false,
        webkit: false,
        syntax: "([number])|([percent])|(fill)|(initial)|(inherit)",
        initial: "100%",
        values: ["[number]", "[percent]", "fill", "initial", "inherit"],
      },
      "border-image-source": {
        moz: false,
        webkit: false,
        syntax: "(none)|(image)|(initial)|(inherit)",
        initial: "none",
        values: ["none", "image", "initial", "inherit"],
      },
      "border-image-width": {
        moz: false,
        webkit: false,
        syntax: "([number])|([percent])|(auto)|(initial)|(inherit)",
        initial: "1",
        values: [
          "[length]",
          "[number]",
          "[percent]",
          "auto",
          "initial",
          "inherit",
        ],
      },
      "border-left": {
        moz: false,
        webkit: false,
        syntax:
          "(([prop:border-left-width]) ([prop:border-left-style]) ([prop:border-left-color]))|(initial)|(inherit)",
        initial: "medium none color",
        values: [
          "[prop:border-left-width]",
          "[prop:border-left-style]",
          "[prop:border-left-color]",
          "initial",
          "inherit",
        ],
      },
      "border-left-color": {
        moz: false,
        webkit: false,
        syntax: "([color])|(transparent)|(initial)|(inherit)",
        initial: "The current color of the element",
        values: ["[color]", "transparent", "initial", "inherit"],
      },
      "border-left-style": {
        moz: false,
        webkit: false,
        syntax:
          "(none)|(hidden)|(dotted)|(dashed)|(solid)|(double)|(groove)|(ridge)|(inset)|(outset)|(initial)|(inherit)",
        initial: "none",
        values: [
          "none",
          "hidden",
          "dotted",
          "dashed",
          "solid",
          "double",
          "groove",
          "ridge",
          "inset",
          "outset",
          "initial",
          "inherit",
        ],
      },
      "border-left-width": {
        moz: false,
        webkit: false,
        syntax: "(medium)|(thin)|(thick)|([length])|(initial)|(inherit)",
        initial: "medium",
        values: ["medium", "thin", "thick", "[length]", "initial", "inherit"],
      },
      "border-radius": {
        moz: true,
        webkit: true,
        syntax: "(([length])|[percent]){1:4}|(initial)|(inherit)",
        initial: "0",
        values: ["[length]", "[percent]", "initial", "inherit"],
      },
      "border-right": {
        moz: false,
        webkit: false,
        syntax:
          "(([prop:border-width]) ([prop:border-style]) ([prop:border-color]))|(initial)|(inherit)",
        initial: "medium none color",
        values: [
          "[prop:border-right-width]",
          "[prop:border-right-style]",
          "[prop:border-right-color]",
          "initial",
          "inherit",
        ],
      },
      "border-right-color": {
        moz: false,
        webkit: false,
        syntax: "([color])|(transparent)|(initial)|(inherit)",
        initial: "black",
        values: ["[color]", "transparent", "initial", "inherit"],
      },
      "border-right-style": {
        moz: false,
        webkit: false,
        syntax:
          "(none)|(hidden)|(dotted)|(dashed)|(solid)|(double)|(groove)|(ridge)|(inset)|(outset)|(initial)|(inherit)",
        initial: "none",
        values: [
          "none",
          "hidden",
          "dotted",
          "dashed",
          "solid",
          "double",
          "groove",
          "ridge",
          "inset",
          "outset",
          "initial",
          "inherit",
        ],
      },
      "border-right-width": {
        moz: false,
        webkit: false,
        syntax: "(medium)|(thin)|(thick)|([length])|(initial)|(inherit)",
        initial: "medium",
        values: ["medium", "thin", "thick", "[length]", "initial", "inherit"],
      },
      "border-spacing": {
        moz: false,
        webkit: false,
        syntax: "([length]){1,2}|(initial)|(inherit)",
        initial: "2px",
        values: ["[length]", "initial", "inherit"],
      },
      "border-style": {
        moz: false,
        webkit: false,
        syntax:
          "(none)|(hidden)|(dotted)|(dashed)|(solid)|(double)|(groove)|(ridge)|(inset)|(outset)|(initial)|(inherit)",
        initial: "none",
        values: [
          "none",
          "hidden",
          "dotted",
          "dashed",
          "solid",
          "double",
          "groove",
          "ridge",
          "inset",
          "outset",
          "initial",
          "inherit",
        ],
      },
      "border-top": {
        moz: false,
        webkit: false,
        syntax:
          "(([prop:border-left-width]) ([prop:border-left-style]) ([prop:border-left-color]))|(initial)|(inherit)",
        initial: "medium none color",
        values: [
          "[prop:border-top-width]",
          "[prop:border-top-style]",
          "[prop:border-top-color]",
          "initial",
          "inherit",
        ],
      },
      "border-top-color": {
        moz: false,
        webkit: false,
        syntax: "([color])|(transparent)|(initial)|(inherit)",
        initial: "The current color of the element",
        values: ["[color]", "transparent", "initial", "inherit"],
      },
      "border-top-left-radius": {
        moz: true,
        webkit: true,
        syntax: "(([length])|[percent]){1,2}|(initial)|(inherit)",
        initial: "0",
        values: ["[length]", "[percent]", "initial", "inherit"],
      },
      "border-top-right-radius": {
        moz: true,
        webkit: true,
        syntax: "(([length])|[percent]){1,2}|(initial)|(inherit)",
        initial: "0",
        values: ["[length]", "[percent]", "initial", "inherit"],
      },
      "border-top-style": {
        moz: false,
        webkit: false,
        syntax:
          "(none)|(hidden)|(dotted)|(dashed)|(solid)|(double)|(groove)|(ridge)|(inset)|(outset)|(initial)|(inherit)",
        initial: "none",
        values: [
          "none",
          "hidden",
          "dotted",
          "dashed",
          "solid",
          "double",
          "groove",
          "ridge",
          "inset",
          "outset",
          "initial",
          "inherit",
        ],
      },
      "border-top-width": {
        moz: false,
        webkit: false,
        syntax: "(medium)|(thin)|(thick)|([length])|(initial)|(inherit)",
        initial: "medium",
        values: ["medium", "thin", "thick", "[length]", "initial", "inherit"],
      },
      "border-width": {
        moz: false,
        webkit: false,
        syntax: "(medium)|(thin)|(thick)|([length])|(initial)|(inherit)",
        initial: "medium",
        values: ["medium", "thin", "thick", "[length]", "initial", "inherit"],
      },
      bottom: {
        moz: false,
        webkit: false,
        syntax: "(auto)|([length])|(initial)|(inherit)",
        initial: "auto",
        values: ["auto", "[length]", "[percent]", "initial", "inherit"],
      },
      "box-decoration-break": {
        moz: false,
        webkit: true,
        syntax: "(slice)|(clone)|(initial)|(inherit)|(unset)",
        initial: "slice",
        values: ["slice", "clone", "initial", "inherit"],
      },
      "box-shadow": {
        moz: true,
        webkit: true,
        syntax:
          "(none)|(h-offset) v-offset blur spread color |(inset)|(initial)|(inherit)",
        initial: "none",
        values: [
          "none",
          "h-offset",
          "v-offset",
          "blur",
          "spread",
          "[color]",
          "inset",
          "initial",
          "inherit",
        ],
      },
      "box-sizing": {
        moz: true,
        webkit: true,
        syntax: "(content-box)|(border-box)|(initial)|(inherit)",
        initial: "content-box",
        values: ["content-box", "border-box", "initial", "inherit"],
      },
      "caption-side": {
        moz: false,
        webkit: false,
        syntax: "(top)|(bottom)|(initial)|(inherit)",
        initial: "top",
        values: ["top", "bottom", "initial", "inherit"],
      },
      "caret-color": {
        moz: false,
        webkit: false,
        syntax: "(auto)|([color])",
        initial: "auto",
        values: ["auto", "[color]"],
      },
      "@charset": {
        moz: false,
        webkit: false,
        syntax: '@charset "charset"',
        initial: "charset",
        values: ["charset"],
      },
      clear: {
        moz: false,
        webkit: false,
        syntax: "(none)|(left)|(right)|(both)|(initial)|(inherit)",
        initial: "none",
        values: ["none", "left", "right", "both", "initial", "inherit"],
      },
      clip: {
        moz: false,
        webkit: false,
        syntax: "(auto)|(shape)|(initial)|(inherit)",
        initial: "auto",
        values: ["auto", "shape", "initial", "inherit"],
      },
      color: {
        moz: false,
        webkit: false,
        syntax: "([color])|(initial)|(inherit)",
        initial: "not specified",
        values: ["[color]", "initial", "inherit"],
      },
      "column-count": {
        moz: true,
        webkit: true,
        syntax: "([number])|(auto)|(initial)|(inherit)",
        initial: "auto",
        values: ["[number]", "auto", "initial", "inherit"],
      },
      "column-fill": {
        moz: true,
        webkit: true,
        syntax: "(balance)|(auto)|(initial)|(inherit)",
        initial: "balance",
        values: ["balance", "auto", "initial", "inherit"],
      },
      "column-gap": {
        moz: true,
        webkit: true,
        syntax: "([length])|(normal)|(initial)|(inherit)",
        initial: "normal",
        values: ["[length]", "normal", "initial", "inherit"],
      },
      "column-rule": {
        moz: true,
        webkit: true,
        syntax:
          "(([prop:column-rule-width]) ([prop:column-rule-style]) ([prop:column-rule-color]))|(initial)|(inherit)",
        initial: "medium none color",
        values: [
          "[prop:column-rule-width]",
          "[prop:column-rule-style]",
          "[prop:column-rule-color]",
          "initial",
          "inherit",
        ],
      },
      "column-rule-color": {
        moz: true,
        webkit: true,
        syntax: "([color])|(initial)|(inherit)",
        initial: "The current color of the element",
        values: ["[color]", "initial", "inherit"],
      },
      "column-rule-style": {
        moz: true,
        webkit: true,
        syntax:
          "(none)|(hidden)|(dotted)|(dashed)|(solid)|(double)|(groove)|(ridge)|(inset)|(outset)|(initial)|(inherit)",
        initial: "none",
        values: [
          "none",
          "hidden",
          "dotted",
          "dashed",
          "solid",
          "double",
          "groove",
          "ridge",
          "inset",
          "outset",
          "initial",
          "inherit",
        ],
      },
      "column-rule-width": {
        moz: true,
        webkit: true,
        syntax: "(medium)|(thin)|(thick)|([length])|(initial)|(inherit)",
        initial: "medium",
        values: ["medium", "thin", "thick", "[length]", "initial", "inherit"],
      },
      "column-span": {
        moz: false,
        webkit: true,
        syntax: "(none)|(all)|(initial)|(inherit)",
        initial: "none",
        values: ["none", "all", "initial", "inherit"],
      },
      "column-width": {
        moz: true,
        webkit: true,
        syntax: "(auto)|([length])|(initial)|(inherit)",
        initial: "auto",
        values: ["auto", "[length]", "initial", "inherit"],
      },
      columns: {
        moz: true,
        webkit: true,
        syntax:
          "(auto)|(([prop:column-width]) ([prop:column-count]))|(initial)|(inherit)",
        initial: "auto auto",
        values: [
          "auto",
          "[prop:column-width]",
          "[prop:column-count]",
          "initial",
          "inherit",
        ],
      },
      content: {
        moz: false,
        webkit: false,
        syntax:
          "(normal)|(none)|(counter)|(attr)|(string)|(open-quote)|(close-quote)|(no-open-quote)|(no-close-quote)|(url)|(initial)|(inherit)",
        initial: "normal",
        values: [
          "normal",
          "none",
          "counter",
          "attr(attribute)",
          "string",
          "open-quote",
          "close-quote",
          "no-open-quote",
          "no-close-quote",
          "url(url)",
          "initial",
          "inherit",
        ],
      },
      "counter-increment": {
        moz: false,
        webkit: false,
        syntax: "(none)|([number])|(initial)|(inherit)",
        initial: "none",
        values: ["none", "[number]", "initial", "inherit"],
      },
      "counter-reset": {
        moz: false,
        webkit: false,
        syntax: "(none)|([number])|(initial)|(inherit)",
        initial: "none",
        values: ["none", "[number]", "initial", "inherit"],
      },
      cursor: {
        moz: false,
        webkit: false,
        syntax:
          "(alias)|(all-scroll)|(auto)|(cell)|(context-menu)|(col-resize)|(copy)|(crosshair)|(default)|(e-resize)|(ew-resize)|(grab)|(grabbing)|(help)|(move)|(n-resize)|(ne-resize)|(nesw-resize)|(ns-resize)|(nw-resize)|(nwse-resize)|(no-drop)|(none)|(not-allowed)|(pointer)|(progress)|(row-resize)|(s-resize)|(se-resize)|(sw-resize)|(text)|(URL)|(vertical-text)|(w-resize)|(wait)|(zoom-in)|(zoom-out)|(initial)|(inherit)",
        initial: "auto",
        values: [
          "alias",
          "all-scroll",
          "auto",
          "cell",
          "context-menu",
          "col-resize",
          "copy",
          "crosshair",
          "default",
          "e-resize",
          "ew-resize",
          "grab",
          "grabbing",
          "help",
          "move",
          "n-resize",
          "ne-resize",
          "nesw-resize",
          "ns-resize",
          "nw-resize",
          "nwse-resize",
          "no-drop",
          "none",
          "not-allowed",
          "pointer",
          "progress",
          "row-resize",
          "s-resize",
          "se-resize",
          "sw-resize",
          "text",
          "URL",
          "vertical-text",
          "w-resize",
          "wait",
          "zoom-in",
          "zoom-out",
          "initial",
          "inherit",
        ],
      },
      direction: {
        moz: false,
        webkit: false,
        syntax: "(ltr)|(rtl)|(initial)|(inherit)",
        initial: "ltr",
        values: ["ltr", "rtl", "initial", "inherit"],
      },
      display: {
        moz: false,
        webkit: false,
        syntax:
          "(inline)|(block)|(contents)|(flex)|(grid)|(inline-block)|(inline-flex)|(inline-grid)|(inline-table)|(list-item)|(run-in)|(table)|(table-caption)|(table-column-group)|(table-header-group)|(table-footer-group)|(table-row-group)|(table-cell)|(table-column)|(table-row)|(none)|(initial)|(inherit)",
        initial: "",
        values: [
          "inline",
          "block",
          "contents",
          "flex",
          "grid",
          "inline-block",
          "inline-flex",
          "inline-grid",
          "inline-table",
          "list-item",
          "run-in",
          "table",
          "table-caption",
          "table-column-group",
          "table-header-group",
          "table-footer-group",
          "table-row-group",
          "table-cell",
          "table-column",
          "table-row",
          "none",
          "initial",
          "inherit",
        ],
      },
      "empty-cells": {
        moz: false,
        webkit: false,
        syntax: "(show)|(hide)|(initial)|(inherit)",
        initial: "show",
        values: ["show", "hide", "initial", "inherit"],
      },
      filter: {
        moz: false,
        webkit: true,
        syntax:
          "(none)|([fn:blur])|([fn:brightness])|([fn:contrast])|([fn:drop-shadow])|([fn:grayscale])|([fn:hue-rotate])|([fn:invert])|([fn:opacity])|([fn:saturate])|([fn:sepia])|([fn:url])",
        initial: "none",
        values: [
          "none",
          "[fn:blur]",
          "[fn:brightness]",
          "[fn:contrast]",
          "[fn:drop-shadow]",
          "[fn:grayscale]",
          "[fn:hue-rotate]",
          "[fn:invert]",
          "[fn:opacity]",
          "[fn:saturate]",
          "[fn:sepia]",
          "[fn:url]",
          "initial",
          "inherit",
        ],
      },
      flex: {
        moz: true,
        webkit: true,
        syntax:
          "(([prop:flex-grow]) ([prop:flex-shrink]) ([prop:flex-basis]))|(auto)|(initial)|(inherit)",
        initial: "0 1 auto",
        values: [
          "[prop:flex-grow]",
          "[prop:flex-shrink]",
          "[prop:flex-basis]",
          "auto",
          "initial",
          "none",
          "inherit",
        ],
      },
      "flex-basis": {
        moz: true,
        webkit: true,
        syntax: "([number])|(auto)|(initial)|(inherit)",
        initial: "auto",
        values: ["[number]", "auto", "initial", "inherit"],
      },
      "flex-direction": {
        moz: true,
        webkit: true,
        syntax:
          "(row)|(row-reverse)|(column)|(column-reverse)|(initial)|(inherit)",
        initial: "row",
        values: [
          "row",
          "row-reverse",
          "column",
          "column-reverse",
          "initial",
          "inherit",
        ],
      },
      "flex-flow": {
        moz: true,
        webkit: true,
        syntax: "flex-direction (flex-wrap)|(initial)|(inherit)",
        initial: "row nowrap",
        values: ["flex-direction", "flex-wrap", "initial", "inherit"],
      },
      "flex-grow": {
        moz: true,
        webkit: true,
        syntax: "([number])|(initial)|(inherit)",
        initial: "0",
        values: ["[number]", "initial", "inherit"],
      },
      "flex-shrink": {
        moz: true,
        webkit: true,
        syntax: "([number])|(initial)|(inherit)",
        initial: "1",
        values: ["[number]", "initial", "inherit"],
      },
      "flex-wrap": {
        moz: true,
        webkit: true,
        syntax: "(nowrap)|(wrap)|(wrap-reverse)|(initial)|(inherit)",
        initial: "nowrap",
        values: ["nowrap", "wrap", "wrap-reverse", "initial", "inherit"],
      },
      float: {
        moz: false,
        webkit: false,
        syntax: "(none)|(left)|(right)|(initial)|(inherit)",
        initial: "none",
        values: ["none", "left", "right", "initial", "inherit"],
      },
      font: {
        moz: false,
        webkit: false,
        syntax:
          "font-style font-variant font-weight font-size/line-height (font-family)|(caption)|(icon)|(menu)|(message-box)|(small-caption)|(status-bar)|(initial)|(inherit)",
        initial: "The default value of the font properties",
        values: [
          "[prop:font-style]",
          "[prop:font-variant]",
          "[prop:font-weight]",
          "[prop:font-size/line-height]",
          "[prop:font-family]",
          "caption",
          "icon",
          "menu",
          "message-box",
          "small-caption",
          "status-bar",
          "initial",
          "inherit",
        ],
      },
      "font-family": {
        moz: false,
        webkit: false,
        syntax: "([family-name])|([generic-family])|(initial)|(inherit)",
        initial: "depends on the browser",
        values: ["[family-name]", "[generic-family]", "initial", "inherit"],
      },
      "font-kerning": {
        moz: false,
        webkit: true,
        syntax: "(auto)|(normal)|(none)",
        initial: "auto",
        values: ["auto", "normal", "none"],
      },
      "font-size": {
        moz: false,
        webkit: false,
        syntax:
          "([length])|([percent])|(medium)|(xx-small)|(x-small)|(small)|(large)|(x-large)|(xx-large)|(smaller)|(larger)|([length])|(initial)|(inherit)",
        initial: "medium",
        values: [
          "medium",
          "xx-small",
          "x-small",
          "small",
          "large",
          "x-large",
          "xx-large",
          "smaller",
          "larger",
          "[length]",
          "[percent]",
          "initial",
          "inherit",
        ],
      },
      "font-size-adjust": {
        moz: false,
        webkit: false,
        syntax: "([number])|(none)|(initial)|(inherit)",
        initial: "none",
        values: ["[number]", "none", "initial", "inherit"],
      },
      "font-stretch": {
        moz: false,
        webkit: false,
        syntax:
          "(ultra-condensed)|(extra-condensed)|(condensed)|(semi-condensed)|(normal)|(semi-expanded)|(expanded)|(extra-expanded)|(ultra-expanded)|(initial)|(inherit)",
        initial: "normal",
        values: [
          "ultra-condensed",
          "extra-condensed",
          "condensed",
          "semi-condensed",
          "normal",
          "semi-expanded",
          "expanded",
          "extra-expanded",
          "ultra-expanded",
          "initial",
          "inherit",
        ],
      },
      "font-style": {
        moz: false,
        webkit: false,
        syntax: "(normal)|(italic)|(oblique)|(initial)|(inherit)",
        initial: "normal",
        values: ["normal", "italic", "oblique", "initial", "inherit"],
      },
      "font-variant": {
        moz: false,
        webkit: false,
        syntax: "(normal)|(small-caps)|(initial)|(inherit)",
        initial: "normal",
        values: ["normal", "small-caps", "initial", "inherit"],
      },
      "font-weight": {
        moz: false,
        webkit: false,
        syntax:
          "(normal)|(bold)|(bolder)|(lighter)|([number])|(initial)|(inherit)",
        initial: "normal",
        values: [
          "normal",
          "bold",
          "bolder",
          "lighter",
          "100",
          "200",
          "300",
          "400",
          "500",
          "600",
          "700",
          "800",
          "900",
          "initial",
          "inherit",
        ],
      },
      grid: {
        moz: false,
        webkit: false,
        syntax:
          "(none)|(grid-template-rows) / (grid-template-columns)|(grid-template-areas)|(grid-template-rows) / [grid-auto-flow] (grid-auto-columns)|[grid-auto-flow] grid-auto-rows / (grid-template-columns)|(initial)|(inherit)",
        initial: "none none none auto auto row",
        values: [
          "none",
          "grid-template rows / grid-template-columns",
          "grid-template-areas",
          "grid-template rows / grid-auto-columns",
          "grid-auto-rows / grid-template-columns",
          "grid-template rows / grid-auto-flow grid-auto-columns",
          "grid-auto flow grid-auto-rows / grid-template-columns",
          "initial",
          "inherit",
        ],
      },
      "grid-area": {
        moz: false,
        webkit: false,
        syntax:
          "(([prop:grid-row-start]) / ([prop:grid-column-start]) / ([prop:grid-row-end]) / ([prop:grid-row-end]))|([label])",
        initial: "auto / auto / auto / auto",
        values: [
          "[prop:grid-row-start]",
          "[prop:grid-column-start]",
          "[prop:grid-row-end]",
          "[prop:grid-column-end]",
          "[label]",
        ],
      },
      "grid-auto-columns": {
        moz: false,
        webkit: false,
        syntax:
          "(auto)|(max-content)|(min-content)|([length])|([percent])|([fn:fit-content])|([fn:minmax])",
        initial: "auto",
        values: [
          "auto",
          "[fn:fit-content]",
          "max-content",
          "min-content",
          "[fn:minmax]",
          "[length]",
          "[percent]",
        ],
      },
      "grid-auto-flow": {
        moz: false,
        webkit: false,
        syntax: "(row)|(column)|(dense)|(row dense)|(column dense)",
        initial: "row",
        values: ["row", "column", "dense", "row dense", "column dense"],
      },
      "grid-auto-rows": {
        moz: false,
        webkit: false,
        syntax: "(auto)|(max-content)|(min-content)|([length])",
        initial: "auto",
        values: ["auto", "max-content", "min-content", "[length]"],
      },
      "grid-column": {
        moz: false,
        webkit: false,
        syntax: "grid-column-start / grid-column-end",
        initial: "auto / auto",
        values: ["[prop:grid-column-start]", "[prop:grid-column-end]"],
      },
      "grid-column-end": {
        moz: false,
        webkit: false,
        syntax: "(auto)|((span) ([number]))|(column-line)",
        initial: "auto",
        values: ["auto", "(span) ([number])", "column-line"],
      },
      "grid-column-gap": {
        moz: false,
        webkit: false,
        syntax: "[length]",
        initial: "0",
        values: ["[length]"],
      },
      "grid-column-start": {
        moz: false,
        webkit: false,
        syntax: "(auto)|((span) ([number]))|(column-line)",
        initial: "auto",
        values: ["auto", "(span) ([number])", "column-line"],
      },
      "grid-gap": {
        moz: false,
        webkit: false,
        syntax: "([prop:grid-row-gap]) ([prop:grid-column-gap])",
        initial: "0 0",
        values: ["[prop:grid-row-gap]", "[prop:grid-column-gap]"],
      },
      "grid-row": {
        moz: false,
        webkit: false,
        syntax: "([prop:grid-row-start]) / ([prop:grid-row-end])",
        initial: "auto / auto",
        values: ["[prop:grid-row-start]", "[prop:grid-row-end]"],
      },
      "grid-row-end": {
        moz: false,
        webkit: false,
        syntax: "(auto)|(row-line)|((span) ([number]))|(column-line)",
        initial: "auto",
        values: ["auto", "(span) ([number])", "column-line"],
      },
      "grid-row-gap": {
        moz: false,
        webkit: false,
        syntax: "[length]",
        initial: "0",
        values: ["[length]"],
      },
      "grid-row-start": {
        moz: false,
        webkit: false,
        syntax: "(auto)|(row-line)",
        initial: "auto",
        values: ["auto", "row-line"],
      },
      "grid-template": {
        moz: false,
        webkit: false,
        syntax:
          "(none)|(grid-template-rows) / (grid-template-columns)|(grid-template-areas)|(initial)|(inherit)",
        initial: "none none none",
        values: [
          "none",
          "grid-template rows / grid-template-columns",
          "grid-template-areas",
          "initial",
          "inherit",
        ],
      },
      "grid-template-areas": {
        moz: false,
        webkit: false,
        syntax: "(none)|(itemnames)",
        initial: "none",
        values: ["none", "itemnames"],
      },
      "grid-template-columns": {
        moz: false,
        webkit: false,
        syntax:
          "(none)|(auto)|(max-content)|(min-content)|([length])|(initial)|(inherit)",
        initial: "none",
        values: [
          "none",
          "auto",
          "max-content",
          "min-content",
          "[length]",
          "initial",
          "inherit",
        ],
      },
      "grid-template-rows": {
        moz: false,
        webkit: false,
        syntax:
          "(none)|(auto)|(max-content)|(min-content)|([length])|(initial)|(inherit)",
        initial: "none",
        values: ["none", "auto", "max-content", "min-content", "[length]"],
      },
      "hanging-punctuation": {
        moz: false,
        webkit: false,
        syntax:
          "(none)|(first)|(last)|(allow-end)|(force-end)|(initial)|(inherit)",
        initial: "none",
        values: [
          "none",
          "first",
          "last",
          "allow-end",
          "force-end",
          "initial",
          "inherit",
        ],
      },
      height: {
        moz: false,
        webkit: false,
        syntax: "(auto)|([length])|(initial)|(inherit)",
        initial: "auto",
        values: ["auto", "[length]", "[percent]", "initial", "inherit"],
      },
      hyphens: {
        moz: false,
        webkit: true,
        syntax: "(none)|(manual)|(auto)|(initial)|(inherit)",
        initial: "manual",
        values: ["none", "manual", "auto", "initial", "inherit"],
      },
      isolation: {
        moz: false,
        webkit: false,
        syntax: "(auto)|(isolate)|(initial)|(inherit)",
        initial: "auto",
        values: ["auto", "isolate", "initial", "inherit"],
      },
      "justify-content": {
        moz: true,
        webkit: true,
        syntax:
          "(flex-start)|(flex-end)|(center)|(space-between)|(space-around)|(initial)|(inherit)",
        initial: "flex-start",
        values: [
          "flex-start",
          "flex-end",
          "center",
          "space-between",
          "space-around",
          "initial",
          "inherit",
        ],
      },
      left: {
        moz: false,
        webkit: false,
        syntax: "(auto)|([length])|(initial)|(inherit)",
        initial: "auto",
        values: ["auto", "[length]", "[percent]", "initial", "inherit"],
      },
      "letter-spacing": {
        moz: false,
        webkit: false,
        syntax: "(normal)|([length])|(initial)|(inherit)",
        initial: "normal",
        values: ["normal", "[length]", "initial", "inherit"],
      },
      "line-height": {
        moz: false,
        webkit: false,
        syntax: "(normal)|([number])|([length])|(initial)|(inherit)",
        initial: "normal",
        values: [
          "normal",
          "[number]",
          "[length]",
          "[percent]",
          "initial",
          "inherit",
        ],
      },
      "list-style": {
        moz: false,
        webkit: false,
        syntax:
          "(([prop:list-style-type]) ([prop:list-style-position]) ([prop:list-style-image]))|(initial)|(inherit)",
        initial: "disc outside none",
        values: [
          "[prop:list-style-type]",
          "[prop:list-style-position]",
          "[prop:list-style-image]",
          "initial",
          "inherit",
        ],
      },
      "list-style-image": {
        moz: false,
        webkit: false,
        syntax: "(none)|(url)|(initial)|(inherit)",
        initial: "none",
        values: ["none", "url", "initial", "inherit"],
      },
      "list-style-position": {
        moz: false,
        webkit: false,
        syntax: "(inside)|(outside)|(initial)|(inherit)",
        initial: "outside",
        values: ["inside", "outside", "initial", "inherit"],
      },
      "list-style-type": {
        moz: false,
        webkit: false,
        syntax:
          "(disc)|(armenian)|(circle)|(cjk-ideographic)|(decimal)|(decimal-leading-zero)|(georgian)|(hebrew)|(hiragana)|(hiragana-iroha)|(katakana)|(katakana-iroha)|(lower-alpha)|(lower-greek)|(lower-latin)|(lower-roman)|(none)|(square)|(upper-alpha)|(upper-greek)|(upper-latin)|(upper-roman)|(initial)|(inherit)",
        initial: "disc",
        values: [
          "disc",
          "armenian",
          "circle",
          "cjk-ideographic",
          "decimal",
          "decimal-leading-zero",
          "georgian",
          "hebrew",
          "hiragana",
          "hiragana-iroha",
          "katakana",
          "katakana-iroha",
          "lower-alpha",
          "lower-greek",
          "lower-latin",
          "lower-roman",
          "none",
          "square",
          "upper-alpha",
          "upper-greek",
          "upper-latin",
          "upper-roman",
          "initial",
          "inherit",
        ],
      },
      margin: {
        moz: false,
        webkit: false,
        syntax: "(([length])|([percent])){1,4}|(auto)|(initial)|(inherit)",
        initial: "0",
        values: ["[length]", "[percent]", "auto", "initial", "inherit"],
      },
      "margin-bottom": {
        moz: false,
        webkit: false,
        syntax: "([length])|([percent])|(auto)|(initial)|(inherit)",
        initial: "0",
        values: ["[length]", "[percent]", "auto", "initial", "inherit"],
      },
      "margin-left": {
        moz: false,
        webkit: false,
        syntax: "([length])|([percent])|(auto)|(initial)|(inherit)",
        initial: "0",
        values: ["[length]", "[percent]", "auto", "initial", "inherit"],
      },
      "margin-right": {
        moz: false,
        webkit: false,
        syntax: "([length])|([percent])|(auto)|(initial)|(inherit)",
        initial: "0",
        values: ["[length]", "[percent]", "auto", "initial", "inherit"],
      },
      "margin-top": {
        moz: false,
        webkit: false,
        syntax: "([length])|(auto)|(initial)|(inherit)",
        initial: "0",
        values: ["[length]", "[percent]", "auto", "initial", "inherit"],
      },
      "max-height": {
        moz: false,
        webkit: false,
        syntax: "(none)|([length])|(initial)|(inherit)",
        initial: "none",
        values: ["none", "[length]", "[percent]", "initial", "inherit"],
      },
      "max-width": {
        moz: false,
        webkit: false,
        syntax: "(none)|([length])|(initial)|(inherit)",
        initial: "none",
        values: ["none", "[length]", "[percent]", "initial", "inherit"],
      },
      "min-height": {
        moz: false,
        webkit: false,
        syntax: "([length])|(initial)|(inherit)",
        initial: "0",
        values: ["[length]", "[percent]", "initial", "inherit"],
      },
      "min-width": {
        moz: false,
        webkit: false,
        syntax: "([length])|(initial)|(inherit)",
        initial: "0",
        values: ["[length]", "[percent]", "initial", "inherit"],
      },
      "mix-blend-mode": {
        moz: false,
        webkit: false,
        syntax:
          "(normal)|(multiply)|(screen)|(overlay)|(darken)|(lighten)|(color-dodge)|(color-burn)|(difference)|(exclusion)|(hue)|(saturation)|([color])|(luminosity)",
        initial: "normal",
        values: [
          "normal",
          "multiply",
          "screen",
          "overlay",
          "darken",
          "lighten",
          "color-dodge",
          "color-burn",
          "difference",
          "exclusion",
          "hue",
          "saturation",
          "[color]",
          "luminosity",
        ],
      },
      "object-fit": {
        moz: false,
        webkit: false,
        syntax:
          "(fill)|(contain)|(cover)|(scale-down)|(none)|(initial)|(inherit)",
        initial: "",
        values: [
          "fill",
          "contain",
          "cover",
          "none",
          "scale-down",
          "initial",
          "inherit",
        ],
      },
      "object-position": {
        moz: false,
        webkit: false,
        syntax: "(position)|(initial)|(inherit)",
        initial: "50% 50%",
        values: ["position", "initial", "inherit"],
      },
      opacity: {
        moz: false,
        webkit: false,
        syntax: "([number])|(initial)|(inherit)",
        initial: "1",
        values: ["[number]", "initial", "inherit"],
      },
      order: {
        moz: true,
        webkit: true,
        syntax: "([number])|(initial)|(inherit)",
        initial: "0",
        values: ["[number]", "initial", "inherit"],
      },
      outline: {
        moz: false,
        webkit: false,
        syntax:
          "(([prop:outline-width]) ([prop:outline-style]) ([prop:outline-color]))|(initial)|(inherit)",
        initial: "medium invert color",
        values: [
          "[prop:outline-width]",
          "[prop:outline-style]",
          "[prop:outline-color]",
          "initial",
          "inherit",
        ],
      },
      "outline-color": {
        moz: false,
        webkit: false,
        syntax: "(invert)|([color])|(initial)|(inherit)",
        initial: "invert",
        values: ["invert", "[color]", "initial", "inherit"],
      },
      "outline-offset": {
        moz: false,
        webkit: false,
        syntax: "([length])|(initial)|(inherit)",
        initial: "0",
        values: ["[length]", "initial", "inherit"],
      },
      "outline-style": {
        moz: false,
        webkit: false,
        syntax:
          "(none)|(hidden)|(dotted)|(dashed)|(solid)|(double)|(groove)|(ridge)|(inset)|(outset)|(initial)|(inherit)",
        initial: "none",
        values: [
          "none",
          "hidden",
          "dotted",
          "dashed",
          "solid",
          "double",
          "groove",
          "ridge",
          "inset",
          "outset",
          "initial",
          "inherit",
        ],
      },
      "outline-width": {
        moz: false,
        webkit: false,
        syntax: "(medium)|(thin)|(thick)|([length])|(initial)|(inherit)",
        initial: "medium",
        values: ["medium", "thin", "thick", "[length]", "initial", "inherit"],
      },
      overflow: {
        moz: false,
        webkit: false,
        syntax: "(visible)|(hidden)|(scroll)|(auto)|(initial)|(inherit)",
        initial: "visible",
        values: ["visible", "hidden", "scroll", "auto", "initial", "inherit"],
      },
      "overflow-x": {
        moz: false,
        webkit: false,
        syntax: "(visible)|(hidden)|(scroll)|(auto)|(initial)|(inherit)",
        initial: "visible",
        values: ["visible", "hidden", "scroll", "auto", "initial", "inherit"],
      },
      "overflow-y": {
        moz: false,
        webkit: false,
        syntax: "(visible)|(hidden)|(scroll)|(auto)|(initial)|(inherit)",
        initial: "visible",
        values: ["visible", "hidden", "scroll", "auto", "initial", "inherit"],
      },
      padding: {
        moz: false,
        webkit: false,
        syntax: "(([length])|([percent])){1,4}|(initial)|(inherit)",
        initial: "0",
        values: ["[length]", "[percent]", "initial", "inherit"],
      },
      "padding-bottom": {
        moz: false,
        webkit: false,
        syntax: "([length])|([percent])|(initial)|(inherit)",
        initial: "0",
        values: ["[length]", "[percent]", "initial", "inherit"],
      },
      "padding-left": {
        moz: false,
        webkit: false,
        syntax: "([length])|(initial)|(inherit)",
        initial: "0",
        values: ["[length]", "[percent]", "initial", "inherit"],
      },
      "padding-right": {
        moz: false,
        webkit: false,
        syntax: "([length])|([percent])|(initial)|(inherit)",
        initial: "0",
        values: ["[length]", "[percent]", "initial", "inherit"],
      },
      "padding-top": {
        moz: false,
        webkit: false,
        syntax: "([length])|([percent])|(initial)|(inherit)",
        initial: "0",
        values: ["[length]", "[percent]", "initial", "inherit"],
      },
      "page-break-after": {
        moz: false,
        webkit: false,
        syntax: "(auto)|(always)|(avoid)|(left)|(right)|(initial)|(inherit)",
        initial: "auto",
        values: [
          "auto",
          "always",
          "avoid",
          "left",
          "right",
          "initial",
          "inherit",
        ],
      },
      "page-break-before": {
        moz: false,
        webkit: false,
        syntax: "(auto)|(always)|(avoid)|(left)|(right)|(initial)|(inherit)",
        initial: "auto",
        values: [
          "auto",
          "always",
          "avoid",
          "left",
          "right",
          "initial",
          "inherit",
        ],
      },
      "page-break-inside": {
        moz: false,
        webkit: false,
        syntax: "(auto)|(avoid)|(initial)|(inherit)",
        initial: "auto",
        values: ["auto", "avoid", "initial", "inherit"],
      },
      perspective: {
        moz: true,
        webkit: true,
        syntax: "([length])|(none)",
        initial: "none",
        values: ["[length]", "none", "initial", "inherit"],
      },
      "perspective-origin": {
        moz: true,
        webkit: true,
        syntax: "x-axis (y-axis)|(initial)|(inherit)",
        initial: "50% 50%",
        values: ["x-axis", "y-axis", "initial", "inherit"],
      },
      "pointer-events": {
        moz: false,
        webkit: false,
        syntax: "(auto)|(none)",
        initial: "auto",
        values: ["auto", "none", "initial", "inherit"],
      },
      position: {
        moz: false,
        webkit: false,
        syntax:
          "(static)|(absolute)|(fixed)|(relative)|(sticky)|(initial)|(inherit)",
        initial: "static",
        values: [
          "static",
          "absolute",
          "fixed",
          "relative",
          "sticky",
          "initial",
          "inherit",
        ],
      },
      quotes: {
        moz: false,
        webkit: false,
        syntax: "(none)|(string)|(initial)|(inherit)",
        initial: "not specified",
        values: [
          "none",
          "string string string string",
          "initial",
          "inherit",
          '"',
          "'",
          "‹",
          "›",
          "«",
          "»",
          "‘",
          "’",
          "“",
          "”",
          "„",
        ],
      },
      resize: {
        moz: true,
        webkit: false,
        syntax: "(none)|(both)|(horizontal)|(vertical)|(initial)|(inherit)",
        initial: "none",
        values: [
          "none",
          "both",
          "horizontal",
          "vertical",
          "initial",
          "inherit",
        ],
      },
      right: {
        moz: false,
        webkit: false,
        syntax: "(auto)|([length])|(initial)|(inherit)",
        initial: "auto",
        values: ["auto", "[length]", "[percent]", "initial", "inherit"],
      },
      "scroll-behavior": {
        moz: false,
        webkit: false,
        syntax: "(auto)|(smooth)|(initial)|(inherit)",
        initial: "auto",
        values: ["auto", "smooth", "initial", "inherit"],
      },
      "tab-size": {
        moz: true,
        webkit: false,
        syntax: "([number])|([length])|(initial)|(inherit)",
        initial: "8",
        values: ["[number]", "[length]", "initial", "inherit"],
      },
      "table-layout": {
        moz: false,
        webkit: false,
        syntax: "(auto)|(fixed)|(initial)|(inherit)",
        initial: "auto",
        values: ["auto", "fixed", "initial", "inherit"],
      },
      "text-align": {
        moz: false,
        webkit: false,
        syntax: "(left)|(right)|(center)|(justify)|(initial)|(inherit)",
        initial: "left if direction is ltr, and right if direction is rtl",
        values: ["left", "right", "center", "justify", "initial", "inherit"],
      },
      "text-align-last": {
        moz: true,
        webkit: false,
        syntax:
          "(auto)|(left)|(right)|(center)|(justify)|(start)|(end)|(initial)|(inherit)",
        initial: "auto",
        values: [
          "auto",
          "left",
          "right",
          "center",
          "justify",
          "start",
          "end",
          "initial",
          "inherit",
        ],
      },
      "text-decoration": {
        moz: false,
        webkit: false,
        syntax:
          "(([prop:text-decoration-line]) ([prop:text-decoration-color]) ([prop:text-decoration-style]))|(initial)|(inherit)",
        initial: "none currentcolor solid",
        values: [
          "[prop:text-decoration-line]",
          "[prop:text-decoration-color]",
          "[prop:text-decoration-style]",
          "initial",
          "inherit",
        ],
      },
      "text-decoration-color": {
        moz: true,
        webkit: true,
        syntax: "([color])|(initial)|(inherit)",
        initial: "currentColor",
        values: ["[color]", "initial", "inherit"],
      },
      "text-decoration-line": {
        moz: true,
        webkit: true,
        syntax:
          "(none)|(underline)|(overline)|(line-through)|(initial)|(inherit)",
        initial: "none",
        values: [
          "none",
          "underline",
          "overline",
          "line-through",
          "initial",
          "inherit",
        ],
      },
      "text-decoration-style": {
        moz: true,
        webkit: false,
        syntax: "(solid)|(double)|(dotted)|(dashed)|(wavy)|(initial)|(inherit)",
        initial: "solid",
        values: [
          "solid",
          "double",
          "dotted",
          "dashed",
          "wavy",
          "initial",
          "inherit",
        ],
      },
      "text-indent": {
        moz: false,
        webkit: false,
        syntax: "([length])|(initial)|(inherit)",
        initial: "0",
        values: ["[length]", "[percent]", "initial", "inherit"],
      },
      "text-justify": {
        moz: false,
        webkit: false,
        syntax:
          "(auto)|(inter-word)|(inter-character)|(none)|(initial)|(inherit)",
        initial: "auto",
        values: [
          "auto",
          "inter-word",
          "inter-character",
          "none",
          "initial",
          "inherit",
        ],
      },
      "text-overflow": {
        moz: false,
        webkit: false,
        syntax: "(clip)|(ellipsis)|(string)|(initial)|(inherit)",
        initial: "clip",
        values: ["clip", "ellipsis", "string", "initial", "inherit"],
      },
      "text-shadow": {
        moz: false,
        webkit: false,
        syntax:
          "h-shadow v-shadow blur-radius ([color])|(none)|(initial)|(inherit)",
        initial: "none",
        values: [
          "h-shadow",
          "v-shadow",
          "blur-radius",
          "[color]",
          "none",
          "initial",
          "inherit",
        ],
      },
      "text-transform": {
        moz: false,
        webkit: false,
        syntax:
          "(none)|(capitalize)|(uppercase)|(lowercase)|(initial)|(inherit)",
        initial: "none",
        values: [
          "none",
          "capitalize",
          "uppercase",
          "lowercase",
          "initial",
          "inherit",
        ],
      },
      top: {
        moz: false,
        webkit: false,
        syntax: "(auto)|([length])|(initial)|(inherit)",
        initial: "auto",
        values: ["auto", "[length]", "[percent]", "initial", "inherit"],
      },
      "transform(2D)": {
        moz: true,
        webkit: true,
        syntax:
          "(none)|([fn:matrix])|([fn:matrix3d])|([fn:translate])|([fn:translate3d])|([fn:translateX])|([fn:translateY])|([fn:translateZ])|([fn:scale])|([fn:scale3d])|([fn:scaleX])|([fn:scaleY])|([fn:scaleZ])|([fn:rotate])|([fn:rotate3d])|([fn:rotateX])|([fn:rotateY])|([fn:rotateZ])|([fn:skew])|([fn:skewX])|([fn:skewY])|([fn:perspective])|(initial)|(inherit)",
        initial: "none",
        values: [
          "none",
          "[fn:matrix]",
          "[fn:matrix3d]",
          "[fn:translate]",
          "[fn:translate3d]",
          "[fn:translateX]",
          "[fn:translateY]",
          "[fn:translateZ]",
          "[fn:scale]",
          "[fn:scale3d]",
          "[fn:scaleX]",
          "[fn:scaleY]",
          "[fn:scaleZ]",
          "[fn:rotate]",
          "[fn:rotate3d]",
          "[fn:rotateX]",
          "[fn:rotateY]",
          "[fn:rotateZ]",
          "[fn:skew]",
          "[fn:skewX]",
          "[fn:skewY]",
          "[fn:perspective]",
          "initial",
          "inherit",
        ],
      },
      "transform-origin(two-value syntax)": {
        moz: true,
        webkit: true,
        syntax: "x-axis y-axis (z-axis)|(initial)|(inherit)",
        initial: "50% 50% 0",
        values: ["x-axis", "y-axis", "z-axis", "initial", "inherit"],
      },
      "transform-style": {
        moz: true,
        webkit: true,
        syntax: "(flat)|(preserve-3d)|(initial)|(inherit)",
        initial: "flat",
        values: ["flat", "preserve-3d", "initial", "inherit"],
      },
      transition: {
        moz: true,
        webkit: true,
        syntax:
          "(([prop:transition-property]) ([prop:transition-duration]) ([prop:transition-timing-function]) ([prop:transition-delay]))|(initial)|(inherit)",
        initial: "all 0s ease 0s",
        values: [
          "[prop:transition-property]",
          "[prop:transition-duration]",
          "[prop:transition-timing-function]",
          "[prop:transition-delay]",
          "initial",
          "inherit",
        ],
      },
      "transition-delay": {
        moz: true,
        webkit: true,
        syntax: "([time])|(initial)|(inherit)",
        initial: "0s",
        values: ["[time]", "initial", "inherit"],
      },
      "transition-duration": {
        moz: true,
        webkit: true,
        syntax: "([time])|(initial)|(inherit)",
        initial: "0s",
        values: ["[time]", "initial", "inherit"],
      },
      "transition-property": {
        moz: true,
        webkit: true,
        syntax: "(none)|(all)|(property)|(initial)|(inherit)",
        initial: "all",
        values: ["none", "all", "property", "initial", "inherit"],
      },
      "transition-timing-function": {
        moz: true,
        webkit: true,
        syntax:
          "(linear)|(ease)|(ease-in)|(ease-out)|(ease-in-out)|(step-start)|(step-end)|([fn:steps])|([fn:cubic-bezier])|(initial)|(inherit)",
        initial: "ease",
        values: [
          "ease",
          "linear",
          "ease-in",
          "ease-out",
          "ease-in-out",
          "step-start",
          "step-end",
          "[fn:steps]",
          "[fn:cubic-bezier]",
          "initial",
          "inherit",
        ],
      },
      "unicode-bidi": {
        moz: false,
        webkit: false,
        syntax:
          "(normal)|(embed)|(bidi-override)|(isolate)|(isolate-override)|(plaintext)|(initial)|(inherit)",
        initial: "normal",
        values: [
          "normal",
          "embed",
          "bidi-override",
          "isolate",
          "isolate-override",
          "plaintext",
          "initial",
          "inherit",
        ],
      },
      "user-select": {
        moz: true,
        webkit: true,
        syntax: "(auto)|(none)|(text)|(all)",
        initial: "auto",
        values: ["auto", "none", "text", "all"],
      },
      "vertical-align": {
        moz: false,
        webkit: false,
        syntax:
          "(baseline)|([length])|(sub)|(super)|(top)|(text-top)|(middle)|(bottom)|(text-bottom)|(initial)|(inherit)",
        initial: "baseline",
        values: [
          "baseline",
          "[length]",
          "[percent]",
          "sub",
          "super",
          "top",
          "text-top",
          "middle",
          "bottom",
          "text-bottom",
          "initial",
          "inherit",
        ],
      },
      visibility: {
        moz: false,
        webkit: false,
        syntax: "(visible)|(hidden)|(collapse)|(initial)|(inherit)",
        initial: "visible",
        values: ["visible", "hidden", "collapse", "initial", "inherit"],
      },
      "white-space": {
        moz: false,
        webkit: false,
        syntax:
          "(normal)|(nowrap)|(pre)|(pre-line)|(pre-wrap)|(initial)|(inherit)",
        initial: "normal",
        values: [
          "normal",
          "nowrap",
          "pre",
          "pre-line",
          "pre-wrap",
          "initial",
          "inherit",
        ],
      },
      width: {
        moz: false,
        webkit: false,
        syntax: "(auto)|([length])|([percent])|(initial)|(inherit)",
        initial: "auto",
        values: ["auto", "[length]", "[percent]", "initial", "inherit"],
      },
      "word-break": {
        moz: false,
        webkit: false,
        syntax:
          "(normal)|(break-all)|(keep-all)|(break-word)|(initial)|(inherit)",
        initial: "normal",
        values: [
          "normal",
          "break-all",
          "keep-all ",
          "break-word",
          "initial",
          "inherit",
        ],
      },
      "word-spacing": {
        moz: false,
        webkit: false,
        syntax: "(normal)|([length])|(initial)|(inherit)",
        initial: "normal",
        values: ["normal", "[length]", "initial", "inherit"],
      },
      "word-wrap": {
        moz: false,
        webkit: false,
        syntax: "(normal)|(break-word)|(initial)|(inherit)",
        initial: "normal",
        values: ["normal", "break-word", "initial", "inherit"],
      },
      "writing-mode": {
        moz: false,
        webkit: false,
        syntax: "(horizontal-tb)|(vertical-rl)|(vertical-lr)",
        initial: "horizontal-tb",
        values: ["horizontal-tb", "vertical-rl", "vertical-lr"],
      },
      "z-index": {
        moz: false,
        webkit: false,
        syntax: "(auto)|([number])|(initial)|(inherit)",
        initial: "auto",
        values: ["auto", "[number]", "initial", "inherit"],
      },
    } as any,
    getPossibleCssValues: function (prop: string) {
      let values = helpers.html.cssProperties[prop]?.values || [];
      values = values.filter(
        (v: string) => !["inherit", "initial", "unset"].includes(v)
      );
      values = values.filter((v: string) => !v.startsWith("["));
      values.unshift(null);
      return values;
    },
  },
};

interface MgParams {
  urlName: string;
}

(async () => {
  const client = await ClientContext.get();

  client.Vue.directive("html-raw", {
    bind(el: HTMLElement, binding: any) {
      el.innerHTML = binding.value;
    },
  });

  client.Vue.directive("dim", {
    bind(el: HTMLElement, binding: any) {
      // Set the opacity to 0.4 if the value is true
      if (binding.value) {
        el.style.opacity = "0.4";
      }
    },
    update(el: HTMLElement, binding: any) {
      // Update the opacity whenever the value changes
      if (binding.value) {
        el.style.opacity = "0.4";
      } else {
        el.style.opacity = "";
      }
    },
  });

  client.Vue.directive("disable", {
    bind(el: HTMLElement, binding: any) {
      // Set the opacity to 0.4 if the value is true
      if (binding.value) {
        el.style.opacity = "0.4";
        el.style.pointerEvents = "none";
      }
    },
    update(el: HTMLElement, binding: any) {
      // Update the opacity whenever the value changes
      if (binding.value) {
        el.style.opacity = "0.4";
        el.style.pointerEvents = "none";
      } else {
        el.style.filter = "";
        el.style.opacity = "";
        el.style.pointerEvents = "";
      }
    },
  });

  await client.compileAll();

  let ideVueApp: any = null;

  const isLocalHost = window.location.hostname == "localhost";
  const dbpHost = `https://db.memegenerator.net`;

  const dbp = (await DatabaseProxy.new(`${dbpHost}/MemeGenerator`)) as any;

  const getNewParams = async () => {
    return (await Params.new(
      () => ideVueApp,
      client.config.params,
      window.location.pathname
    )) as unknown as MgParams;
  };

  const params = await getNewParams();

  const vueManager = await VueManager.new(client);

  ideVueApp = new client.Vue({
    data: {
      // MemeGenerator
      builders: {
        all: {} as any,
        mainMenu: {} as any,
      },
      // General
      state: null as unknown as StateTracker,
      vm: vueManager,
      client,
      dbp,
      analytics: await AnalyticsTracker.new(),
      params: params,
      url: helpers.url,
      html: helpers.html,
      comps: client.Vue.ref(client.comps),
      compsDic: {},
      compNames: [],
      templates: client.templates,
      isLoading: 0,
      error: null,
      loadingImageUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/lightbox2/2.11.3/images/loading.gif",
      key1: 1,
      _uniqueClientID: 1,
      isAdmin: false,
      newCssRules: {},
    },
    async mounted() {
      await this.init();
    },
    methods: {
      async init() {
        const self = this as any;
        self.newCssRules = await (await fetch(`/css-tool`)).json();
        self.compsDic = client.comps.toMap((c: Component) => c.name.hashCode());
        self.compNames = client.comps.map((c: Component) => c.name);
        await self.ensureBuilders();
        self.isAdmin = window.location.hostname == "localhost";
        document.addEventListener("scroll", () => {
          self.$emit("scroll");
        });
      },
      async getBuilder(urlNameOrID: string | number) {
        const self = this as any;
        await self.ensureBuilders();
        if (typeof urlNameOrID == "string") {
          return Object.values(ideVueApp.builders.all).find(
            (b: any) => b.urlName == urlNameOrID
          );
        }
        if (typeof urlNameOrID == "number") {
          return self.builders.all[urlNameOrID];
        }
        throw new Error("Invalid builder ID");
      },
      async ensureBuilders() {
        const self = this as any;
        if (!self.builders?.length) {
          const allBuilders = await self.dbp.builders.select.all();
          self.builders.mainMenu = allBuilders.filter(
            (b: any) => b.visible?.mainMenu
          );
          self.builders.all = allBuilders.toMap((b: any) => b._id);
        }
      },
      getBuilderComponentName(builder: any) {
        if (!builder) return null;
        return `e-format-${builder.format.replace(/\./g, "-")}`;
      },
      async mediaToTemp(media: any) {
        const self = this as any;
        const builder = await self.getBuilder(media.builderID);
        let temp = self.builderSourceToTemplate(builder.format, builder.source);
        temp = self.applyMediaToTemplate(media, temp);
        return temp;
      },
      builderSourceToTemplate(format: string, source: any) {
        const self = this as any;

        if (!source) return null;

        if (format == "image.grid") {
          const temp = {
            id: self.getUniqueClientID(),
            type: "grid",
            visible: true,
            aspectRatio: null,
            gap: 0.02,
            caption: !source.title
              ? null
              : {
                  visible: true,
                  editable: source.title.editable,
                  text: source.title.text,
                  font: "Arial",
                  color: "white",
                  align: {
                    h: "center",
                    v: "top",
                  },
                  uppercase: false,
                  scale: 0.6,
                },
            items: [],
            gridItems: {
              width: source.gridItems?.width || 3,
            },
            join: JSON.parse(JSON.stringify(source.join)),
          } as any;

          const hasSubgrid = true || source.subgrid.items > 1;

          const textColor = hasSubgrid ? "white" : "yellow";

          const captionItems = source.captions.items || source.captions;
          const editable = source.captions.editable || false;

          if (Array.isArray(captionItems)) {
            for (let i = 0; i < captionItems.length; i++) {
              const caption = {
                visible: true,
                editable: editable,
                text: captionItems[i],
                font: "Arial",
                color: "white",
                align: {
                  h: "center",
                  v: "bottom",
                },
                uppercase: false,
              };

              let subgrid = temp;

              if (hasSubgrid) {
                subgrid = {
                  id: self.getUniqueClientID(),
                  type: "grid",
                  visible: true,
                  aspectRatio: "1/1",
                  caption,
                  rotation: 0,
                  items: [],
                } as any;

                temp.items.push(subgrid);
              }

              for (let j = 0; j < source.subgrid.items; j++) {
                subgrid.items.add({
                  id: self.getUniqueClientID(),
                  type: "image",
                  visible: true,
                  imageID: null,
                  removeBackground: false,
                  caption: hasSubgrid ? null : caption,
                  trans: {
                    pos: {
                      x: 0.5,
                      y: 0.5,
                    },
                    scale: 1,
                  },
                  shadow: {
                    x: 0,
                    y: 0,
                    blur: 0,
                    color: "#000000",
                    opacity: 1,
                  },
                });
              }
            }
          } else {
            // { default: ?, min: ?, max: ? }
            for (let i = 0; i < captionItems.default; i++) {
              temp.items.push({
                id: self.getUniqueClientID(),
                type: "image",
                visible: true,
                imageID: null,
                removeBackground: false,
                caption: {
                  visible: true,
                  editable: editable,
                  text: "",
                  font: "Arial",
                  color: textColor,
                  align: {
                    h: "center",
                    v: "bottom",
                  },
                  uppercase: false,
                },
                trans: {
                  pos: {
                    x: 0.5,
                    y: 0.5,
                  },
                  scale: 1,
                },
                shadow: {
                  x: 0,
                  y: 0,
                  blur: 0,
                  color: "#000000",
                  opacity: 1,
                },
              });
            }

            for (let i = 0; i < (source.defaults || []).length; i++) {
              Object.assign(temp.items[i], source.defaults[i]);
            }
          }

          return temp;
        }

        if (format == "layers") {
          const getNewItem = (sourceItem: any) => {
            let item = {
              id: self.getUniqueClientID(),
              type: sourceItem.type,
              visible: true,
              editable: sourceItem.editable || true,
            } as any;

            if (item.type == "caption") {
              Object.assign(item, sourceItem);
            }

            if (item.type == "image") {
              item.imageID = sourceItem.imageID || null;
              item.removeBackground = sourceItem.removeBackground || true;
              item.trans = sourceItem.trans || {
                pos: {
                  x: 0.5,
                  y: 0.5,
                },
                scale: 1,
              };
              item.shadow = sourceItem.shadow || {
                x: 0,
                y: 0,
                blur: 0,
                color: "#000000",
                opacity: 1,
              };
            }

            if (item.type == "rainbow") {
              item.colors = sourceItem.colors || [
                "#000000",
                "#ffffff",
                "#000000",
                "#ffffff",
                "#000000",
                "#ffffff",
              ];
              item.colorsCount = sourceItem.colorsCount || 2;
              item.pattern = sourceItem.pattern || "pizza";
              item.slices = sourceItem.slices || 6;
            }

            item.rect = sourceItem.rect;

            item = JSON.parse(JSON.stringify(item));

            return item;
          };

          const temp = {
            id: self.getUniqueClientID(),
            type: "grid",
            layers: true,
            visible: true,
            aspectRatio: source.aspectRatio,
            gap: 0.02,
            items: [],
            gridItems: {
              width: 1,
            },
            can: {
              remove: {
                background: true,
              },
            },
          } as any;

          for (const item of source.items) {
            temp.items.push(getNewItem(item));
          }

          return temp;
        }

        throw new Error("Unknown builder source type");
      },
      applyMediaToTemplate(media: any, temp: any) {
        if (!media || !temp) return null;
        if (media.mediaGenerator)
          temp = Objects.deepMerge(temp, media.mediaGenerator.content.item);
        temp = Objects.deepMerge(temp, media.content.item);
        return temp;
      },
      getComponent(uidOrName: number | string) {
        const uid = typeof uidOrName == "number" ? uidOrName : null;
        let name = typeof uidOrName == "string" ? uidOrName : null;
        if (name) name = name.replace(/-/g, ".");
        if (!uid && !name) return null;
        if (uid) {
          const vue = vueManager.getVue(uid);
          if (!vue) return null;
          const compName = vue.$data._.comp.name;
          if (!compName) return null;
          const comp = (this as any).compsDic[compName.hashCode()];
          return comp;
        }
        if (name) {
          const comp = (this as any).compsDic[name.hashCode()];
          return comp;
        }
      },
      isComponentName(name: string) {
        if (!name) return false;
        const self = this as any;
        return !!self.compsDic[name.hashCode()];
      },
      getElementsFromViewNode(node: [string, any]) {
        if (!node) return [];
        if (!node[1]) return [];
        return document.querySelectorAll(`[path="${node[1].path}"]`);
      },
      getViewChildNodes(node: [string, any]) {
        if (!node[1]) return [];
        if (typeof node[1] != "object") return [];
        let children = Object.entries(node[1]);
        children = children.filter((c) => !this.isAttributeName(c[0]));
        return children;
      },
      addPaths(compName: string, dom: any) {
        return addPaths(this, compName, dom);
      },
      ideWatch(uid: number, name: string) {
        const ideWatches = (this as any).ideWatches;
        const key = `${uid}-${name}`;
        if (ideWatches[key]) return;
        ideWatches[key] = { uid, name };
      },
      isAttributeName(name: string) {
        const self = this as any;
        return client.isAttributeName(self.compNames, name);
      },
      getDescendants(vue: any, filter: any): any[] {
        if (typeof filter == "string") {
          const compName = filter;
          filter = (vue: any) => vue.$data._?.comp.name == compName;
        }
        const vues = [];
        for (const child of vue.$children) {
          if (filter(child)) vues.push(child);
          vues.push(...this.getDescendants(child, filter));
        }
        return vues;
      },
      async navigateTo(item: any) {
        const url = typeof item == "string" ? item : this.itemToUrl(item);
        const self = this as any;
        self.error = null;
        window.history.pushState({}, "", url);
        await this.refresh();
      },
      async notifyNavigateTo(item: any) {
        const self = this as any;
        const url = this.itemToUrl(item);
        const item2 = url?.startsWith("/m/")
          ? await self.mediaToTemp(item)
          : item;
        const imageUrl = helpers.url.itemImage(item2);
        (window as any).alertify
          .message(
            `<a href="${url}" onclick="ideVueApp.navigateTo(this.href); return false;" class="clickable"><img src="${imageUrl}" /></a><div class="opacity-50 text-center"></div>`
          )
          .delay(0);
      },
      itemToUrl(item: any) {
        if (typeof item == "string") return item;
        if (item.instanceID) return helpers.url.instance(item);
        if (item.threadID) return helpers.url.thread({ _id: item.threadID });
        if (item.builderID && item.content) return helpers.url.media(item);
        throw new Error("Unknown item type");
      },
      notify(componentName: string, item: any) {
        const self = this as any;
        self.$emit("notify", { componentName, item });
      },
      async compileApp() {
        await client.compileApp();
        this.refresh();
      },
      async reloadComponentsFromServer() {
        await client.reloadComponentsFromServer();
        await this.init();
        await this.refreshComponents();
      },
      async getMoreInstances(pageIndex: number) {
        const self = this as any;
        return await self.dbp.instances.select.popular(
          "en",
          pageIndex,
          self.params.urlName
        );
      },
      textToHtml(text: string, options: any = {}) {
        if (!text) return null;
        var s = text;
        // HTML encode
        s = htmlEncode(s) || "";
        // >greentext
        s = s.replace(/^&gt;(.*)$/gm, "<span class='greentext'>&gt;$1</span>");
        // "text" to <strong>text</strong>
        s = s.replace(/"(.*?)"(?!\w)/g, "<strong>$1</strong>");
        // line breaks
        s = s.replace(/\n/g, "<br />");
        // First line title
        if (options.firstLine) {
          // Convert the first line (ending with <br />) to <div class="title">..</div>
          s = s.replace(
            /^(.*?<br \/>)/g,
            `<div class='${options.firstLine}'>$1</div>`
          );
        }
        return s;
      },
      async refresh() {
        const self = this as any;
        const newParams = (await getNewParams()) as any;
        for (const key in newParams) {
          if ("value" in newParams[key])
            self.params[key] = newParams[key].value;
        }
        //(this as any).key1++;
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      async refreshComponents() {
        const self = this as any;
        self.key1++;
        await self.$nextTick();
        await self.state.restoreState();
      },
      instanceToGenerator(instance: any) {
        let gen = Objects.json.parse(JSON.stringify(instance));
        gen._id = gen.generatorID;
        return gen;
      },
      getInstanceText(instance: any) {
        if (!instance) return null;
        return [instance.text0, instance.text1].filter((a) => a).join(", ");
      },
      getMediaText(media: any) {
        return null;
      },
      setDocumentTitle(title: string) {
        document.title = [title, "Meme Generator"].filter((a) => a).join(" - ");
      },
      getKey(item: any) {
        if (!item) return null;
        if (item._id) return item._id;
        if (item._uid) return item._uid;
        return item;
      },
      getRandomStanza(poem: any) {
        if (!poem?.length) return null;
        const count = poem.length;
        const index = Math.floor(Math.random() * count);
        return poem[index];
      },
      getWorkspaceStyle() {
        const style = {} as any;
        if (!this.isDevEnv()) {
          style.display = "none";
        }
        return style;
      },
      isDevEnv() {
        return window.location.hostname == "localhost";
      },
      visualizedYaml(obj: any) {
        let yaml = (window as any).jsyaml.dump(obj) as string;
        yaml = yaml.replace(/: true$/gm, ": ✔️");
        yaml = yaml.replace(/: false$/gm, ": ❌");
        // Replace colors with colored squares:
        // '#ff0000\n' -> '🟥' (<span class="color"></span>)
        // Works with 3, 6 and 8 digit hex colors
        yaml = yaml.replace(/'#\w{3,8}\b'/g, (match) => {
          let color = match.slice(1); // Remove the '#' symbol
          color = color.substring(0, color.length - 1);
          return `<span class="color" style="background-color:${color}"></span>`;
        });
        // Replace "null" and "undefined" with <span class="opacity-50">null/undefined</span>
        yaml = yaml.replace(/\b(null|undefined)\b/g, (match) => {
          return `<span class="opacity-30">${match}</span>`;
        });
        // Replace numbers (: [number]) with <span class="green">[number]</span>
        yaml = yaml.replace(/: (\d+)/g, (match, p1) => {
          return `: <span class="green">${p1}</span>`;
        });
        // Replace strings (: [string]) with <span class="yellow">[string]</span>
        yaml = yaml.replace(/: (\w.*)/g, (match, p1) => {
          return `: <span class="yellow">${p1}</span>`;
        });
        // Replace keys ([key]: ) with <span class="opacity-50">[key]: </span>
        yaml = yaml.replace(/^(\s*)(\w+):/gm, (match, p1, p2) => {
          return `${p1}<span class="opacity-50">${p2}:</span>`;
        });
        return yaml;
      },
      async uploadFile(file: any) {
        const self = this as any;
        const imageUrl = await this.getImageUrlFromDataTransferFile(file);
        const s = [] as string[];
        s.push(`<img src='${imageUrl}' />`);
        s.push("<h3 class='text-center'>uploading..</h3>");
        s.push(
          `<div class='text-center'><img src='${self.$data.loadingImageUrl}'></img></div>`
        );
        const msg = client.alertify.message(s.join("")).delay(0);

        return new Promise(async (resolve, reject) => {
          let url = "https://img.memegenerator.net/upload";

          var xhr = new XMLHttpRequest();
          var formData = new FormData();
          xhr.open("POST", url, true);

          xhr.addEventListener("readystatechange", async function (e: any) {
            if (xhr.readyState == 4 && xhr.status == 200) {
              const image = Objects.json.parse(xhr.responseText);
              // Download the image from the server
              // this also takes some time, and we should hold the loading indicator
              await self.downloadImage(image._id);
              msg.dismiss();
              resolve(image);
            } else if (xhr.readyState == 4 && xhr.status != 200) {
              msg.dismiss();
              reject(xhr.responseText);
            }
          });

          formData.append("image", file);
          xhr.send(formData);
        });
      },
      async getImageUrlFromDataTransferFile(file: any) {
        // fileDropEvent.preventDefault();
        // const files = fileDropEvent.dataTransfer.files;
        // const imageUrls = [];

        function readFileAsDataURL(file: any) {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function (event: any) {
              resolve(event.target.result);
            };
            reader.onerror = function (event: any) {
              reject(event.error);
            };
            reader.readAsDataURL(file);
          });
        }

        const imageUrl = await readFileAsDataURL(file);
        return imageUrl;

        // for (let i = 0; i < files.length; i++) {
        //   const file = files[i];
        //   if (file.type.startsWith("image/")) {
        //     const imageUrl = await readFileAsDataURL(file);
        //     imageUrls.push(imageUrl);
        //   }
        // }

        // return imageUrls;
      },
      async downloadImage(imageIdOrUrl: any) {
        const self = this as any;
        const imageUrl =
          typeof imageIdOrUrl === "string"
            ? imageIdOrUrl
            : self.url.image(imageIdOrUrl, true);

        return new Promise((resolve, reject) => {
          const imageObj = new Image();
          imageObj.onload = () => {
            resolve(imageObj);
          };
          imageObj.onerror = () => {
            reject(imageObj);
          };
          imageObj.src = imageUrl;
        });
      },
      getIcon(item: any) {
        const stateItemIcons = {
          // method
          m: "🔴",
          // event
          e: "⚡",
          // prop
          p: "🔗",
          // data
          d: "🧊",
          // computed
          c: "💡",
        } as any;
        if (item.type) return stateItemIcons[item.type] || "❔";
        return "❔";
      },
      getUniqueClientID() {
        const self = this as any;
        return self.$data._uniqueClientID++;
      },
      getRandomUniqueID() {
        // Fallback for browsers without crypto.getRandomValues support
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
          /[xy]/g,
          (char) => {
            const random = (Math.random() * 16) | 0;
            const value = char === "x" ? random : (random & 0x3) | 0x8;
            return value.toString(16);
          }
        );
      },
      async wait(condition: () => boolean, timeout = 10000) {
        // If no condition is provided, just wait the timeout
        if (typeof condition == "number") {
          return new Promise((resolve: any, reject: any) => {
            setTimeout(resolve, condition as number);
          });
        }
        // Wait for a condition to be true
        const startedAt = Date.now();
        const tryInterval = 100;
        return new Promise(async (resolve: any, reject: any) => {
          const tryAgain = async () => {
            if (Date.now() - startedAt > timeout) return reject();
            if (await condition()) {
              resolve();
            } else {
              setTimeout(tryAgain, tryInterval);
            }
          };
          tryAgain();
        });
      },
      scrollIntoView(element: any) {
        const elementRect = element.getBoundingClientRect();
        const bodyRect = document.body.getBoundingClientRect();
        const offset = elementRect.top - bodyRect.top;
        window.scroll({
          top: offset - 200,
          behavior: "smooth",
        });
      },
    },
    watch: {
      newCssRules: {
        handler: async function (newCssRules: any) {
          const self = this as any;
          // POST to /css-tool with { css: newCssRules }
          const response = await fetch("/css-tool", {
            method: "POST",
            body: JSON.stringify({ css: newCssRules }),
          });
        },
      },
    },
  });

  ideVueApp.state = await StateTracker.new(() => ideVueApp, vueManager, client);

  ideVueApp.$mount("#app");

  window.addEventListener("popstate", async function (event) {
    await ideVueApp.refresh();
  });

  (window as any).ideVueApp = ideVueApp;
})();
