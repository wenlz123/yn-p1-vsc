"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const app_1 = require("./app");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "元年 P1" is now active!');
    const WORD_REG = /(-?\d*\.\d\w*)|([^\`\~\!\@\$\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\s]+)/gi;
    let completionItemProvider = new app_1.P1CompletionItemProvider();
    let completion = vscode.languages.registerCompletionItemProvider([
        {
            language: "vue",
            scheme: "file"
        },
        {
            language: "html",
            scheme: "file"
        }
    ], completionItemProvider, "", " ", ":", "<", '"', "'", "/", "@", "(");
    let vueLanguageConfig = vscode.languages.setLanguageConfiguration("vue", {
        wordPattern: WORD_REG
    });
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    // let disposable = vscode.commands.registerCommand(
    //   "extension.helloWorld",
    //   () => {
    //     // The code you place here will be executed every time your command is executed
    //     // Display a message box to the user
    //     vscode.window.showInformationMessage("Hello VS Code!");
    //   }
    // );
    context.subscriptions.push(completion, vueLanguageConfig);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map