// Base class for GPTs (modules that use ChatGPT)

import { ProgressReport } from "./ProgressReport";
import { ChatOpenAI, Roles } from "../../OpanAI/classes/ChatOpenAI";

abstract class BaseGPT {
  protected readonly prompt: string;
  protected readonly onReport: (report: ProgressReport) => void;
  protected readonly chat = ChatOpenAI.new(Roles.ChatGPT);

  constructor(prompt: string, onReport: (report: ProgressReport) => void) {
    this.prompt = prompt;
    this.onReport = onReport;
  }

  abstract execute(): Promise<any>;

  protected report(text: string, progress?: number) {
    let report: ProgressReport = { text, progress };
    this.onReport(report);
  }
}

export { BaseGPT };
