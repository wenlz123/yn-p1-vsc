import * as vscode from "vscode";

export class ImportFixer {
  public fix(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    tag: string,
    componentPath: string
  ): void {
    let edit = this.getTextEdit(document, componentPath);

    vscode.workspace.applyEdit(edit);
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
