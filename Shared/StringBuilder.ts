class StringBuilder {
  private lines: string[] = [];
  indentation: number = 0;

  constructor(indent: number = 0) {
    this.indentation = indent;
  }

  getLines(): string[] {
    return this.lines;
  }

  addLine(line: string): StringBuilder {
    this.lines.push(this.getIndentStr() + line);
    return this;
  }

  addLines(lines: string[]): StringBuilder {
    for (const line of lines) {
      this.addLine(line);
    }
    return this;
  }

  indent(): StringBuilder {
    this.indentation++;
    return this;
  }

  unindent(): StringBuilder {
    this.indentation--;
    return this;
  }

  private getIndentStr(): string {
    return " ".repeat(this.indentation);
  }

  toString(): string {
    return this.lines.join("\n");
  }
}

export { StringBuilder };
