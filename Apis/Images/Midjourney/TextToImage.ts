import { TNL } from "tnl-midjourney-api";

const TNL_API_KEY = "your_api_key_here";
const tnl = new TNL(TNL_API_KEY);

const prompt = "a cat playing the piano";
const response = await tnl.imagine(prompt);

console.log(response);

class TextToImage {
  create(prompt: string) {}
}
