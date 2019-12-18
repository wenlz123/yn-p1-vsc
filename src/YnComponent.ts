import * as vscode from "vscode";

const template_default = `<div class="{name}">

</div>`;
const css_default = `.{name} {

}`;
const index_default = `import { defineComponent, VUE } from "yn-p1/libs/utils/ComponentUtils";
import template from "./{name}.html";
import definition from "./{name}.js";
import metadata from "./metadata.json";
import "./{name}.css";

export default defineComponent({
  name: "{name}",
  type: VUE,
  template,
  definition,
  metadata
});`;
const js_default = `export default {

}`;
const metadata_default = `{
  "name": "{name}",
  "displayName": "@",
  "version": "1.0.0",
  "desc": "@",
  "properties": {
  },
  "events": {
  },
  "slots": {
  }
}`;
const help_cookbook_default = `/* eslint-disable no-useless-escape */

export default {
  whenToUseDesc: \`\`,
  registerDesc: \`import "";\`,
  demoData: [
    {
      title: "",
      desc: "",
      code: \`\`
    }
  ]
};`;
const nls_default_translations = `{
  "dt": {
    "displayName": "{displayName}",
    "desc": "{desc}"
  }
}`;

export class YnComponent {
  public async add(...args): Promise<void> {
    let name = await vscode.window.showInputBox({
      prompt: "组件标签",
      placeHolder: "公共组件请以yn-开头，应用组件请以应用缩写-开头"
    });

    if (!name) {
      return;
    }

    let displayName = await vscode.window.showInputBox({
      prompt: "组件显示名称",
      placeHolder: "组件简短描述"
    });

    if (!displayName) {
      return;
    }

    let desc = await vscode.window.showInputBox({
      prompt: "组件描述",
      placeHolder: "组件详细描述"
    });

    if (!desc) {
      return;
    }

    let terminal = args[0];
    let path = args[1].path;
    // terminal.show(true);
    terminal.sendText(`cd ${path}`);
    terminal.sendText(`mkdir ${name}`);
    terminal.sendText(`mkdir ${name}/resources`);
    terminal.sendText(`mkdir ${name}/resources/help`);
    terminal.sendText(`mkdir ${name}/resources/nls`);
    let nameReplaceReg = /\{name\}/g;
    let displayNameReplaceReg = /\{displayName\}/g;
    let descReplaceReg = /\{desc\}/g;
    terminal.sendText('echo "Create html file."');
    terminal.sendText(
      `echo '${template_default.replace(nameReplaceReg, name)}' > ${name +
        "/" +
        name}.html`
    );
    terminal.sendText('echo "Create index js file."');
    terminal.sendText(
      `echo '${index_default.replace(nameReplaceReg, name)}' > ${name +
        "/index"}.js`
    );
    terminal.sendText('echo "Create view model file."');
    terminal.sendText(`echo '${js_default}' > ${name + "/" + name}.js`);
    terminal.sendText('echo "Create css file."');
    terminal.sendText(
      `echo '${css_default.replace(nameReplaceReg, name)}' > ${name +
        "/" +
        name}.css`
    );
    terminal.sendText('echo "Create metadata json."');
    terminal.sendText(
      `echo '${metadata_default.replace(nameReplaceReg, name)}' > ${name +
        "/metadata.json"}`
    );
    terminal.sendText('echo "Create cookbook file."');
    setTimeout(() => {
      terminal.sendText(
        `echo '${help_cookbook_default}' > ${name +
          "/resources/help/cookbook.js"}`
      );
    }, 50);
    setTimeout(() => {
      terminal.sendText('echo "Create default translation file."');
    }, 50);
    setTimeout(() => {
      terminal.sendText(
        `echo '${nls_default_translations
          .replace(displayNameReplaceReg, displayName)
          .replace(descReplaceReg, desc)}' > ${name +
          "/resources/nls/ui-translations.json"}`
      );
    }, 50);
  }

  public getTextEdit(document: vscode.TextDocument, componentPath: string) {
    let edit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
    if (this.alreadyResolved(document, componentPath)) {
      //   return edit;
    } else {
      let currentDoc = document.getText();
      let importLineCode = 'import "' + componentPath + '";';
      let exp = new RegExp(/import\s*[^\s;]*;/g);
      let match = currentDoc.match(exp);
      if (match) {
        // has component like directly import
        let lastImport = match[match.length - 1];
        currentDoc = currentDoc.replace(
          lastImport,
          lastImport + "\n" + importLineCode
        );
      } else {
        exp = new RegExp(/import[^;]*;/g);
        match = currentDoc.match(exp);
        if (match) {
          // if there is import scirpt.
          let lastImport = match[match.length - 1];
          currentDoc = currentDoc.replace(
            lastImport,
            lastImport + "\n" + importLineCode
          );
        } else {
          exp = new RegExp("<s*scripts*>");
          let scriptMatch = currentDoc.match(exp);
          if (scriptMatch) {
            // has script tag
            let scriptTag = scriptMatch[0];
            currentDoc = currentDoc.replace(
              scriptTag,
              scriptTag + "\n" + importLineCode
            );
          } else {
            // do not have script
            currentDoc += "\n<script>\n" + importLineCode + "\n</script>";
          }
        }
      }
      edit.replace(
        document.uri,
        new vscode.Range(0, 0, document.lineCount, 0),
        currentDoc
      );
    }
    return edit;
  }

  private alreadyResolved(
    document: vscode.TextDocument,
    componentPath: string
  ) {
    let exp = new RegExp('import\\s*"' + componentPath + '";');
    let currentDoc = document.getText();
    let foundImport = currentDoc.match(exp);
    return foundImport;
  }
}
