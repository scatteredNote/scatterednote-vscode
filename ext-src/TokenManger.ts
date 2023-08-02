import * as vscode from "vscode";


const TOKENKEY = "token"
const USERNAMEKEY = "username"
export class TokenManager {
    static globalState: vscode.Memento;

    static setToken(token: string) {
        return this.globalState.update(TOKENKEY, token)
    }

    static setUsername(username: string) {
        return this.globalState.update(USERNAMEKEY, username)
    }

    static getToken(): string | undefined {
        return this.globalState.get(TOKENKEY);
    }

    static getUsername(): string | undefined {
        return this.globalState.get(USERNAMEKEY);
    }
}