"use strict";

import {
  window,
  commands,
  ViewColumn,
  Disposable,
  TextDocumentContentProvider,
  Event,
  Uri,
  CancellationToken,
  workspace,
  CompletionItemProvider,
  ProviderResult,
  TextDocument,
  Position,
  CompletionItem,
  CompletionList,
  CompletionItemKind,
  SnippetString,
  Range,
  EventEmitter
} from "vscode";
import * as TAGS from "./config/yn-components.json";
// import ATTRS from "./config/ui-attributes.js";

const prettyHTML = require("pretty");

const YN_P1 = "元年 P1";

export interface Query {
  path: string;
  label: string;
  detail: string;
  description: string;
}

export interface TagObject {
  text: string;
  offset: number;
}

export function encodeDocsUri(query?: Query): Uri {
  return Uri.parse(`antdv-helper://search?${JSON.stringify(query)}`);
}

export function decodeDocsUri(uri: Uri): Query {
  return <Query>JSON.parse(uri.query);
}

export class App {
  private _disposable!: Disposable;
  public WORD_REG: RegExp = /(-?\d*\.\d\w*)|([^\`\~\!\@\$\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\s]+)/gi;

  getSeletedText() {
    let editor = window.activeTextEditor;

    if (!editor) {
      return;
    }

    let selection = editor.selection;

    if (selection.isEmpty) {
      let text = [];
      let range = editor.document.getWordRangeAtPosition(
        selection.start,
        this.WORD_REG
      );

      return editor.document.getText(range);
    } else {
      return editor.document.getText(selection);
    }
  }

  setConfig() {
    // https://github.com/Microsoft/vscode/issues/24464
    // const config = workspace.getConfiguration("editor");
    // const quickSuggestions = config.get("quickSuggestions");
    // if (!quickSuggestions["strings"]) {
    //   config.update("quickSuggestions", { strings: true }, true);
    // }
  }

  openHtml(query: Query | undefined, title: string) {
    // const { label, detail } = query;
    // const panel = window.createWebviewPanel(label, detail, ViewColumn.One, {
    //   enableScripts: true, // 启用JS，默认禁用
    //   retainContextWhenHidden: true // webview被隐藏时保持状态，避免被重置
    // });
    // // And set its HTML content
    // panel.webview.html = this.getWebviewContent(query);
  }

  openDocs(
    query?: Query,
    title = "antdv-helper",
    editor = window.activeTextEditor
  ) {
    this.openHtml(query, title);
  }

  dispose() {
    this._disposable.dispose();
  }

  getWebviewContent(query: Query) {
    const config = workspace.getConfiguration("antdv-helper");
    const linkUrl = config.get("link-url");
    const path = query.path;
    const iframeSrc = `${linkUrl}/components/${path}`;
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cat Coding</title>
    </head>
    <body>
      <iframe style="position: absolute;border: none;left: 0;top: 0;width: 100%;height: 100%;" src="${iframeSrc}"></iframe>
    </body>
    </html>`;
  }
}

const HTML_CONTENT = (query: Query) => {
  const config = workspace.getConfiguration("antdv-helper");
  const linkUrl = config.get("link-url");
  const path = query.path;
  const iframeSrc = `${linkUrl}/components/${path}`;
  return `
    <body style="background-color: white">
    <iframe style="position: absolute;border: none;left: 0;top: 0;width: 100%;height: 100%;" src="${iframeSrc}"></iframe>
    </body>`;
};

// export class AntdvDocsContentProvider implements TextDocumentContentProvider {
//   private _onDidChange = new EventEmitter<Uri>();

//   get onDidChange(): Event<Uri> {
//     return this._onDidChange.event;
//   }

//   public update(uri: Uri) {
//     this._onDidChange.fire(uri);
//   }

//   provideTextDocumentContent(
//     uri: Uri,
//     token: CancellationToken
//   ): string | Thenable<string> {
//     return HTML_CONTENT(decodeDocsUri(uri));
//   }
// }

export class P1CompletionItemProvider implements CompletionItemProvider {
  private _document!: TextDocument;
  private _position!: Position;
  private tagReg: RegExp = /<([\w-]+)\s+/g;
  private attrReg: RegExp = /(?:\(|\s*)(\w+)=['"][^'"]*/;
  private tagStartReg: RegExp = /<([\w-]*)$/;
  private pugTagStartReg: RegExp = /^\s*[\w-]*$/;
  private size: number = 0;
  private quotes: string = "";

  getPreTag(): TagObject | undefined {
    let line = this._position.line;
    let tag: TagObject | string | undefined;
    let txt = this.getTextBeforePosition(this._position);

    while (this._position.line - line < 10 && line >= 0) {
      if (line !== this._position.line) {
        txt = this._document.lineAt(line).text;
      }
      tag = this.matchTag(this.tagReg, txt, line);

      if (tag === "break") {
        return;
      }
      if (tag) {
        return <TagObject>tag;
      }
      line--;
    }
    return;
  }

  getPreAttr(): string | false | null {
    let txt = this.getTextBeforePosition(this._position).replace(
      /"[^'"]*(\s*)[^'"]*$/,
      ""
    );
    let end = this._position.character;
    let start = txt.lastIndexOf(" ", end) + 1;
    let parsedTxt = this._document.getText(
      new Range(this._position.line, start, this._position.line, end)
    );

    return this.matchAttr(this.attrReg, parsedTxt);
  }

  matchAttr(reg: RegExp, txt: string): string | null | false {
    let match: RegExpExecArray | null = reg.exec(txt);
    return !/"[^"]*"/.test(txt) && match && match[1];
  }

  matchTag(
    reg: RegExp,
    txt: string,
    line: number
  ): TagObject | string | undefined {
    let match: RegExpExecArray | null;
    let arr: TagObject[] = [];

    if (
      /<\/?[-\w]+[^<>]*>[\s\w]*<?\s*[\w-]*$/.test(txt) ||
      (this._position.line === line &&
        (/^\s*[^<]+\s*>[^<\/>]*$/.test(txt) ||
          /[^<>]*<$/.test(txt[txt.length - 1])))
    ) {
      return "break";
    }
    while ((match = reg.exec(txt))) {
      arr.push({
        text: match[1],
        offset: this._document.offsetAt(new Position(line, match.index))
      });
    }
    return arr.pop();
  }

  getTextBeforePosition(position: Position): string {
    var start = new Position(position.line, 0);
    var range = new Range(start, position);
    return this._document.getText(range);
  }
  getTagSuggestion() {
    let suggestions = [];

    let id = 100;
    for (let tag in TAGS) {
      suggestions.push(this.buildTagSuggestion(tag, TAGS[tag], id));
      id++;
    }
    return suggestions;
  }

  getAttrValueSuggestion(tag: string, attr: string): CompletionItem[] {
    let suggestions:
      | CompletionItem[]
      | { label: any; kind: CompletionItemKind }[] = [];
    const values = this.getAttrValues(tag, attr);
    values.forEach((value: any) => {
      suggestions.push({
        label: value,
        kind: CompletionItemKind.Value
      });
    });
    return suggestions;
  }

  getAttrSuggestion(tag: string) {
    let suggestions:
      | any[]
      | {
          label: any;
          insertText: string | SnippetString;
          kind: CompletionItemKind;
          detail: string;
          documentation: any;
        }[] = [];
    let tagAttrs = this.getTagAttrs(tag);
    let preText = this.getTextBeforePosition(this._position);
    let prefix = preText
      .replace(/['"]([^'"]*)['"]$/, "")
      .split(/\s|\(+/)
      .pop();
    // method attribute
    if (prefix) {
      const method = prefix[0] === "@";
      // bind attribute
      const bind = prefix[0] === ":";

      prefix = prefix.replace(/[:@]/, "");

      if (/[^@:a-zA-z\s]/.test(prefix[0])) {
        return suggestions;
      }

      tagAttrs.forEach((attr: string) => {
        const attrItem = this.getAttrItem(tag, attr);
        if (
          attrItem &&
          (prefix && (!prefix.trim() || this.firstCharsEqual(attr, prefix)))
        ) {
          const sug = this.buildAttrSuggestion(
            { attr, tag, bind, method },
            attrItem
          );
          sug && suggestions.push(sug);
        }
      });
    }
    // for (let attr in ATTRS) {
    //   const attrItem = this.getAttrItem(tag, attr);
    //   if (attrItem && attrItem.global && (!prefix.trim() || this.firstCharsEqual(attr, prefix))) {
    //     const sug = this.buildAttrSuggestion({attr, tag: null, bind, method}, attrItem);
    //     sug && suggestions.push(sug);
    //   }
    // }

    return suggestions;
  }

  buildTagSuggestion(
    tag: string,
    tagVal: { subtags?: any; defaults?: any; description?: any },
    id: number
  ) {
    const snippets: any[] = [];
    let index = 0;
    let that = this;
    function build(
      tag: any,
      { subtags, defaults }: any,
      snippets: any[] | string[]
    ) {
      let attrs = "";
      defaults &&
        defaults.forEach((item: any, i: number) => {
          attrs += ` ${item}=${that.quotes}$${index + i + 1}${that.quotes}`;
        });
      snippets.push(`${index > 0 ? "<" : ""}${tag}${attrs}>`);
      index++;
      subtags &&
        subtags.forEach((item: string | number) =>
          build(item, TAGS[item], snippets)
        );
      snippets.push(`</${tag}>`);
    }
    build(tag, tagVal, snippets);

    return {
      label: tag,
      sortText: `0${id}${tag}`,
      insertText: new SnippetString(
        prettyHTML("<" + snippets.join(""), { indent_size: this.size }).substr(
          1
        )
      ),
      kind: CompletionItemKind.Snippet,
      detail: YN_P1,
      documentation: tagVal.description
    };
  }

  buildAttrSuggestion(
    { attr, tag, bind, method },
    { description, type, optionType, defaultValue }
  ) {
    if (
      (method && type === "method") ||
      (bind && type !== "method") ||
      (!method && !bind)
    ) {
      let documentation = description;
      optionType && (documentation += "\n" + `type: ${optionType}`);
      defaultValue && (documentation += "\n" + `default: ${defaultValue}`);
      return {
        label: attr,
        insertText:
          type && type === "flag"
            ? `${attr} `
            : new SnippetString(`${attr}=${this.quotes}$1${this.quotes}$0`),
        kind:
          type && type === "method"
            ? CompletionItemKind.Method
            : CompletionItemKind.Property,
        detail: "Ant Design Vue",
        documentation
      };
    } else {
      return;
    }
  }

  getAttrValues(tag: string | undefined, attr: string | undefined) {
    let attrItem = this.getAttrItem(tag, attr);
    let options = attrItem && attrItem.options;
    if (!options && attrItem) {
      if (attrItem.type === "boolean") {
        options = ["true", "false"];
      }
    }
    return options || [];
  }

  getTagAttrs(tag: string) {
    return (TAGS[tag] && TAGS[tag].attributes) || [];
  }

  getAttrItem(tag: string | undefined, attr: string | undefined) {
    // return ATTRS[`${tag}/${attr}`] || ATTRS[attr];
    return {
      options: [],
      type: "TODO",
      description: "TODO",
      optionType: "TODO",
      defaultValue: "TODO"
    };
  }

  isAttrValueStart(tag: Object | string | undefined, attr: string | undefined) {
    return tag && attr;
  }

  isAttrStart(tag: TagObject | undefined) {
    return tag;
  }

  isTagStart() {
    let txt = this.getTextBeforePosition(this._position);
    return this.tagStartReg.test(txt);
  }

  firstCharsEqual(str1: string, str2: string) {
    if (str2 && str1) {
      return str1[0].toLowerCase() === str2[0].toLowerCase();
    }
    return false;
  }
  // tentative plan for vue file
  notInTemplate(): boolean {
    let line = this._position.line;
    while (line) {
      if (/^\s*<script.*>\s*$/.test(<string>this._document.lineAt(line).text)) {
        return true;
      }
      line--;
    }
    return false;
  }

  provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<CompletionItem[] | CompletionList> {
    this._document = document;
    this._position = position;

    // const config = workspace.getConfiguration("antdv-helper");
    // this.size = config.get("indent-size");
    this.size = 2;
    // const normalQuotes = config.get("quotes") === "double" ? '"' : "'";
    // this.quotes = normalQuotes;
    this.quotes = `"`;

    let tag: TagObject | string | undefined = this.getPreTag();
    let attr = this.getPreAttr();
    if (tag && attr && this.isAttrValueStart(tag, attr)) {
      return this.getAttrValueSuggestion(tag.text, attr);
    } else if (tag && this.isAttrStart(tag)) {
      return this.getAttrSuggestion(tag.text);
    } else if (this.isTagStart()) {
      switch (document.languageId) {
        case "vue":
          return this.notInTemplate() ? [] : this.getTagSuggestion();
        case "html":
          // todo
          return this.getTagSuggestion();
      }
    } else {
      return [];
    }
  }
}
