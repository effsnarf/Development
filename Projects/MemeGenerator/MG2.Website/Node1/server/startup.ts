import path from "path";
import { Configuration } from "../../../../../Shared/Configuration";

export default async function () {
  console.clear();
  console.log("Server is initializing...");
  const config = await Configuration.new();
}
