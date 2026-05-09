import type { SsrDataFromServer } from "../../src/server/actions/ServeInfoPage.ts";
import Index from "./Index.tsx";
import type ReactDOMClient from "react-dom/client";

const { React, ReactDOM } = window;

declare global {
    interface Window {
        ReactDOM: typeof ReactDOMClient,
    }
}

function neverNull(): never {
    throw new Error("Unexpected null value");
}

export default function main() {
    const reactContainer = document.getElementById("react-app-root-container") ?? neverNull();
    const dataFromServer = JSON.parse(document.getElementById("ssr-data-from-server")?.textContent ?? neverNull()) as SsrDataFromServer;
    const root = ReactDOM.createRoot(reactContainer);
    root.render(React.createElement(Index, {
        infoHash: dataFromServer.infoHash,
    }));
}