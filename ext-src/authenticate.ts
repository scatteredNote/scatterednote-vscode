import * as vscode from "vscode";
import { apiBaseUrl } from "./constant";
import * as polka from "polka";
import { TokenManager } from "./TokenManger";

export const authenticate = (fn: () => void) => {
    const app = polka()

    app.get("/api/:token/:username", async (req, res) => {
        const { token, username } = req.params;
        if (!token) {
            res.end(`<h1>something went wrong</h1>`)
            return
        }
        await TokenManager.setToken(token);
        await TokenManager.setUsername(username);
        fn();
        res.end(`<h1>auth was succesful, you can close this tab and go back to your vscode</h1>`)
        app.server?.close()
    })

    app.listen(54321, (err: Error) => {

        if (err) {
            vscode.window.showErrorMessage(err.message)
        }
        else {
            vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(`${apiBaseUrl}/api/session`));
        }
    })
    
}