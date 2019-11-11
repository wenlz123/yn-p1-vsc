"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const TAGS = require("./metadata/vscMetadata.json");
// import ATTRS from "./config/ui-attributes.js";
const prettyHTML = require("pretty");
const YN_P1 = "元年 P1";
function encodeDocsUri(query) {
    return vscode_1.Uri.parse(`antdv-helper://search?${JSON.stringify(query)}`);
}
exports.encodeDocsUri = encodeDocsUri;
function decodeDocsUri(uri) {
    return JSON.parse(uri.query);
}
exports.decodeDocsUri = decodeDocsUri;
class App {
    constructor() {
        this.WORD_REG = /(-?\d*\.\d\w*)|([^\`\~\!\@\$\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\s]+)/gi;
    }
    getSeletedText() {
        let editor = vscode_1.window.activeTextEditor;
        if (!editor) {
            return;
        }
        let selection = editor.selection;
        if (selection.isEmpty) {
            let text = [];
            let range = editor.document.getWordRangeAtPosition(selection.start, this.WORD_REG);
            return editor.document.getText(range);
        }
        else {
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
    openHtml(query, title) {
        // const { label, detail } = query;
        // const panel = window.createWebviewPanel(label, detail, ViewColumn.One, {
        //   enableScripts: true, // 启用JS，默认禁用
        //   retainContextWhenHidden: true // webview被隐藏时保持状态，避免被重置
        // });
        // // And set its HTML content
        // panel.webview.html = this.getWebviewContent(query);
    }
    openDocs(query, title = "antdv-helper", editor = vscode_1.window.activeTextEditor) {
        this.openHtml(query, title);
    }
    dispose() {
        this._disposable.dispose();
    }
    getWebviewContent(query) {
        const config = vscode_1.workspace.getConfiguration("antdv-helper");
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
exports.App = App;
const HTML_CONTENT = (query) => {
    const config = vscode_1.workspace.getConfiguration("antdv-helper");
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
class P1CompletionItemProvider {
    constructor() {
        this.tagReg = /<([\w-]+)\s+/g;
        this.attrReg = /(?:\(|\s*)(\w+)=['"][^'"]*/;
        this.tagStartReg = /<([\w-]*)$/;
        this.pugTagStartReg = /^\s*[\w-]*$/;
        this.size = 2;
        this.quotes = `"`;
    }
    getPreTag() {
        let line = this._position.line;
        let tag;
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
                return tag;
            }
            line--;
        }
        return;
    }
    getPreAttr() {
        let txt = this.getTextBeforePosition(this._position).replace(/"[^'"]*(\s*)[^'"]*$/, "");
        let end = this._position.character;
        let start = txt.lastIndexOf(" ", end) + 1;
        let parsedTxt = this._document.getText(new vscode_1.Range(this._position.line, start, this._position.line, end));
        return this.matchAttr(this.attrReg, parsedTxt);
    }
    matchAttr(reg, txt) {
        let match = reg.exec(txt);
        return !/"[^"]*"/.test(txt) && match && match[1];
    }
    matchTag(reg, txt, line) {
        let match;
        let arr = [];
        if (/<\/?[-\w]+[^<>]*>[\s\w]*<?\s*[\w-]*$/.test(txt) ||
            (this._position.line === line &&
                (/^\s*[^<]+\s*>[^<\/>]*$/.test(txt) ||
                    /[^<>]*<$/.test(txt[txt.length - 1])))) {
            return "break";
        }
        while ((match = reg.exec(txt))) {
            arr.push({
                text: match[1],
                offset: this._document.offsetAt(new vscode_1.Position(line, match.index))
            });
        }
        return arr.pop();
    }
    getTextBeforePosition(position) {
        var start = new vscode_1.Position(position.line, 0);
        var range = new vscode_1.Range(start, position);
        return this._document.getText(range);
    }
    getTagSuggestion() {
        let suggestions = [];
        // let id = 100;
        for (let tag in TAGS) {
            suggestions.push(this.buildTagSuggestion(tag, TAGS[tag]));
            // id++;
        }
        return suggestions;
    }
    getAttrValueSuggestion(tag, attr) {
        let suggestions = [];
        const values = this.getAttrValues(tag, attr);
        values.forEach((value) => {
            suggestions.push({
                label: value,
                kind: vscode_1.CompletionItemKind.Value
            });
        });
        return suggestions;
    }
    getAttrSuggestion(tag) {
        let suggestions = [];
        let preText = this.getTextBeforePosition(this._position);
        let prefix = preText
            .replace(/['"]([^'"]*)['"]$/, "")
            .split(/\s|\(+/)
            .pop();
        // method attribute
        // if (prefix) {
        const eventFlag = prefix[0] === "@";
        // bind attribute
        const propertyFlag = prefix[0] === ":";
        prefix = prefix.replace(/[:@]/, "");
        if (/[^@:a-zA-z\s]/.test(prefix[0])) {
            return suggestions;
        }
        // let tagAttrs = this.getTagAttrs(tag, eventFlag, propertyFlag);
        if (!eventFlag) {
            // all or property
            let properties = TAGS[tag].properties;
            Reflect.ownKeys(properties).forEach((attr) => {
                const attrItem = properties[attr];
                if (attrItem &&
                    (!prefix || (!prefix.trim() || this.firstCharsEqual(attr, prefix)))) {
                    const sug = this.buildAttrSuggestion({
                        attr,
                        tag,
                        propertyFlag: true,
                        eventFlag: false
                    }, attrItem);
                    sug && suggestions.push(sug);
                }
            });
        }
        if (!propertyFlag) {
            // all or event
            let events = TAGS[tag].events;
            Reflect.ownKeys(events).forEach((attr) => {
                const attrItem = events[attr];
                if (attrItem &&
                    (!prefix || (!prefix.trim() || this.firstCharsEqual(attr, prefix)))) {
                    const sug = this.buildAttrSuggestion({
                        attr,
                        tag,
                        propertyFlag: false,
                        eventFlag: true,
                        prefixWithAt: eventFlag
                    }, attrItem);
                    sug && suggestions.push(sug);
                }
            });
            // }
        }
        return suggestions;
    }
    buildTagSuggestion(tag, tagVal) {
        const snippets = [];
        let index = 0;
        let that = this;
        function build(tag, { subtags, defaultFields }, snippets) {
            let attrs = "";
            defaultFields &&
                defaultFields.forEach((item, i) => {
                    attrs += ` ${item}=${that.quotes}$${index + i + 1}${that.quotes}`;
                });
            snippets.push(`${index > 0 ? "<" : ""}${tag}${attrs}${"$" + (index + 1)}>`);
            index++;
            subtags &&
                subtags.forEach((item) => build(item, TAGS[item], snippets));
            snippets.push(`$0</${tag}>`);
        }
        build(tag, tagVal, snippets);
        let documentation = new vscode_1.MarkdownString(`___描述：___${tagVal.displayName}`);
        documentation.appendText("\n\n");
        documentation.appendMarkdown(`___详情：___${tagVal.desc} 详见：[Cookbook](http://192.168.12.28:8888/#/others/cookbook?type=components&key=${tag})`);
        return {
            label: tag,
            // sortText: `0${tag}`,
            insertText: new vscode_1.SnippetString(prettyHTML("<" + snippets.join(""), { indent_size: this.size }).substr(1)),
            kind: vscode_1.CompletionItemKind.Snippet,
            detail: YN_P1,
            documentation
        };
    }
    buildAttrSuggestion({ attr, tag, propertyFlag, eventFlag, prefixWithAt }, { displayName, desc, type, defaultValue, value, valueDesc, valueList }) {
        // if (
        //   (eventFlag && type === "method") ||
        //   (propertyFlag && type !== "method") ||
        //   (!eventFlag && !propertyFlag)
        // ) {
        let documentation = new vscode_1.MarkdownString(`___描述：___${displayName}`);
        documentation.appendText("\n\n");
        documentation.appendMarkdown(`___类型：___${type}`);
        documentation.appendText("\n\n");
        if (value || valueDesc) {
            documentation.appendMarkdown(`___默认值：___`);
            if (value) {
                documentation.appendText(value);
            }
            if (valueDesc) {
                documentation.appendText(`默认值描述：${valueDesc}`);
            }
        }
        if (valueList) {
            documentation.appendMarkdown(`___值列表：___${valueList.join(",")}`);
            documentation.appendText("\n\n");
        }
        documentation.appendMarkdown(`___详情：___${desc} 详见：[Cookbook](http://192.168.12.28:8888/#/others/cookbook?type=components&key=${tag})`);
        // optionType && (documentation += "\n" + `type: ${optionType}`);
        // defaultValue && (documentation += "\n" + `default: ${defaultValue}`);
        return {
            label: attr,
            insertText: new vscode_1.SnippetString(`${(eventFlag && !prefixWithAt ? "@" : "") + attr}=${this.quotes}$1${this.quotes}$0`),
            // insertText:
            //   type && type === "flag"
            //     ? `${attr} `
            //     : new SnippetString(`${attr}=${this.quotes}$1${this.quotes}$0`),
            kind: eventFlag ? vscode_1.CompletionItemKind.Method : vscode_1.CompletionItemKind.Property,
            detail: YN_P1,
            documentation
        };
        // } else {
        //   return;
        // }
    }
    getAttrValues(tag, attr) {
        let attrItem = this.getAttrItem(tag, attr);
        let options = attrItem && attrItem.valueList;
        if (!options && attrItem) {
            if (attrItem.type === "boolean") {
                options = ["true", "false"];
            }
        }
        return options || [];
    }
    // getTagAttrs(tag: string, eventFlg: boolean, propertyFlg: boolean) {
    //   return (TAGS[tag] && TAGS[tag].properties) || [];
    // }
    getAttrItem(tag, attr, type = "property") {
        return TAGS[tag][type === "property" ? "properties" : "events"][attr];
    }
    isAttrValueStart(tag, attr) {
        return tag && attr;
    }
    isAttrStart(tag) {
        return tag;
    }
    isTagStart() {
        let txt = this.getTextBeforePosition(this._position);
        return this.tagStartReg.test(txt);
    }
    firstCharsEqual(str1, str2) {
        if (str2 && str1) {
            return str1[0].toLowerCase() === str2[0].toLowerCase();
        }
        return false;
    }
    // tentative plan for vue file
    notInTemplate() {
        let line = this._position.line;
        while (line) {
            if (/^\s*<script.*>\s*$/.test(this._document.lineAt(line).text)) {
                return true;
            }
            line--;
        }
        return false;
    }
    provideCompletionItems(document, position, token) {
        this._document = document;
        this._position = position;
        // const config = workspace.getConfiguration("antdv-helper");
        // this.size = config.get("indent-size");
        // this.size = 2;
        // const normalQuotes = config.get("quotes") === "double" ? '"' : "'";
        // this.quotes = normalQuotes;
        // this.quotes = `"`;
        let tag = this.getPreTag();
        let attr = this.getPreAttr();
        if (tag && attr && this.isAttrValueStart(tag, attr)) {
            return this.getAttrValueSuggestion(tag.text, attr);
        }
        else if (tag && this.isAttrStart(tag)) {
            return this.getAttrSuggestion(tag.text);
        }
        else if (this.isTagStart()) {
            switch (document.languageId) {
                case "vue":
                    return this.notInTemplate() ? [] : this.getTagSuggestion();
                case "html":
                    // todo
                    return this.getTagSuggestion();
            }
        }
        else {
            return [];
        }
    }
}
exports.P1CompletionItemProvider = P1CompletionItemProvider;
//# sourceMappingURL=app.js.map