import "../../Shared/Extensions";
import fs from "fs";
import "colors";
import { Configuration } from "@shared/Configuration";
import { Loading } from "@shared/Loading";
import { Database } from "@shared/Database/Database";
import { OpenAI, Model } from "../../Apis/OpenAI/classes/OpenAI";
import { ChatOpenAI, Role, Roles } from "../../Apis/OpenAI/classes/ChatOpenAI";

interface ShortSub {
  id: number;
  l: string[];
}

(async () => {
  const argv = process.argv;

  if (argv.length < 3) throw `Usage: SubtitleTranslator [input.srt]`;

  const inputFile = argv[2];
  const targetLanguage = "Hebrew";
  const tarLangCode = targetLanguage.toLowerCase().substring(0, 2);
  const outputFile = `${inputFile
    .replace(".en.", ".")
    .replace(".srt", `.${targetLanguage.toLowerCase()}.srt`)}`;

  if (!inputFile.endsWith(".srt")) throw `Only .srt files are supported.`;
  if (outputFile == inputFile)
    throw `Input: ${inputFile}, output: ${outputFile}`;

  const chat = await ChatOpenAI.new(
    Roles.Null,
    false,
    Model.Default,
    false,
    OpenAI.effApiKey
  );

  const subsStr = fs
    .readFileSync(inputFile, "utf8")
    .replace(/<i>/g, "")
    .replace(/<\/i>/g, "");

  const allSubs = subsStr
    .trim()
    .split("\n\n")
    .map((s) => s.split("\n"))
    .map((s) => ({
      id: parseInt(s[0]),
      time: s[1],
      lines: s.skip(2).map((l) => l.trim()),
    }));

  let leftSubs = [...allSubs];

  const transSubs = [];

  const batchSize = 10;

  let batchSubs = leftSubs.take(batchSize);

  console.log(outputFile);

  while (batchSubs.length) {
    const arraySubs = batchSubs.map(
      (b) =>
        ({
          id: b.id,
          l: b.lines,
        } as ShortSub)
    );

    console.log(
      `Translating ${batchSize} lines ${transSubs.length}-${
        transSubs.length + batchSize - 1
      }…`.yellow
    );

    const prompt = `
    Please translate this to ${targetLanguage}.
    Make sure to keep the JSON structure exactly as it is.
    Reply with the translated JSON and nothing else.

    ${JSON.stringify(arraySubs)}
    `;

    const transArraySubs = JSON.parse(
      (await chat.send(prompt)).trim()
    ) as ShortSub[];

    for (const sub of transArraySubs) {
      transSubs.push({
        id: sub.id,
        time: allSubs.find((s) => s.id == sub.id)?.time,
        lines: sub.l,
      });
    }

    if (transSubs.length > 5) break;

    leftSubs = leftSubs.skip(batchSubs.length);
    batchSubs = leftSubs.take(batchSize);
  }

  console.log(transSubs);

  const transSubsStr = transSubs
    .map(
      (s) => `${s.id}
${s.time}
${s.lines.join("\n")}
`
    )
    .join("\n");

  fs.writeFileSync(outputFile, transSubsStr);
})();
