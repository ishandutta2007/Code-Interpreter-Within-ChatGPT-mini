// import Browser from 'webextension-polyfill'
// import { getProviderConfigs, ProviderType } from '../config'
// import { BARDProvider, sendMessageFeedbackBard } from './providers/bard'
// import { ChatGPTProvider, getChatGPTAccessToken, sendMessageFeedback } from './providers/chatgpt'
// import { OpenAIProvider } from './providers/openai'
// import { Provider } from './types'

// async function generateAnswers(
//   port: Browser.Runtime.Port,
//   question: string,
//   conversationId: string | undefined,
//   parentMessageId: string | undefined,
//   // conversationContext: ConversationContext | undefined,
//   contextIds: any,
//   requestParams: any,
// ) {
//   const providerConfigs = await getProviderConfigs()

//   let provider: Provider
//   if (providerConfigs.provider === ProviderType.BARD) {
//     provider = new BARDProvider()
//   } else if (providerConfigs.provider === ProviderType.ChatGPT) {
//     const token = await getChatGPTAccessToken()
//     provider = new ChatGPTProvider(token)
//   } else if (providerConfigs.provider === ProviderType.GPT3) {
//     const { apiKey, model } = providerConfigs.configs[ProviderType.GPT3]!
//     provider = new OpenAIProvider(apiKey, model)
//   } else {
//     throw new Error(`Unknown provider ${providerConfigs.provider}`)
//   }

//   const controller = new AbortController()
//   port.onDisconnect.addListener(() => {
//     controller.abort()
//     cleanup?.()
//   })

//   const { cleanup } = await provider.generateAnswer({
//     prompt: question,
//     signal: controller.signal,
//     onEvent(event) {
//       if (event.type === 'done') {
//         port.postMessage({ event: 'DONE' })
//         return
//       }
//       port.postMessage(event.data)
//     },
//     // conversationId: conversationId, //used for chatGPT
//     // parentMessageId: parentMessageId, //used for chatGPT
//     // conversationContext: conversationContext, //used for BARD
//     contextIds: contextIds, //used for BARD
//     requestParams: requestParams, //used for BARD
//   })
// }

// Browser.runtime.onConnect.addListener((port) => {
//   port.onMessage.addListener(async (msg) => {
//     console.debug('received msg', msg)
//     try {
//       await generateAnswers(
//         port,
//         msg.question,
//         msg.conversationId,
//         msg.parentMessageId,
//         // msg.conversationContext,
//         msg.contextIds,
//         msg.requestParams,
//       )
//     } catch (err: any) {
//       console.error(err)
//       port.postMessage({ error: err.message })
//     }
//   })
// })

// Browser.runtime.onMessage.addListener(async (message) => {
//   if (message.type === 'FEEDBACK') {
//     const providerConfigs = await getProviderConfigs()
//     if (providerConfigs.provider === ProviderType.ChatGPT) {
//       const token = await getChatGPTAccessToken()
//       await sendMessageFeedback(token, message.data)
//     } else {
//       await sendMessageFeedbackBard(message.data)
//     }
//   } else if (message.type === 'OPEN_OPTIONS_PAGE') {
//     Browser.runtime.openOptionsPage()
//   } else if (message.type === 'GET_ACCESS_TOKEN') {
//     return getChatGPTAccessToken()
//   }
// })

// Browser.runtime.onInstalled.addListener((details) => {
//   if (details.reason === 'install') {
//     Browser.runtime.openOptionsPage()
//   }
// })

import { XMLHttpRequest } from "./xhr-shim.js";
self.XMLHttpRequest = XMLHttpRequest;

import "./pyodide/pyodide.asm.js";
import { loadPyodide } from "./pyodide/pyodide.mjs";

let resolve;
let ready = new Promise((res) => {
  resolve = res;
});

let pyodide;
let port;

function outputHandler(data) {
    const message = {
        type: "text",
        data: data,
    }
    port.postMessage(message);
}

function errorHandler(err) {
    const lines = err.message.split("\n");
    outputHandler(lines[0]);
    let start = false;
    for (const line of lines.slice(1, -1)) {
        if (line.includes("File \"<exec>\"")) {
            start = true;
        }
        if (start && line) {
            outputHandler(line);
        }
    }
}

self.plot_handler = function(data) {
    const message = {
        type: "png",
        data: "data:image/png;base64," + data,
    }
    port.postMessage(message);
};

chrome.runtime.onConnect.addListener((_port) => {
    port = _port;
    port.onMessage.addListener(async (message) => {
        await ready;
        if (message.type === "execute") {
            try {
                await pyodide.runPythonAsync(message.data);
            } catch (err) {
                errorHandler(err);
            }
        } else if (message.type === "upload") {
            const data = base64ToBinary(message.data);
            pyodide.FS.writeFile(message.name, data, {encoding: "binary"});
        } else if (message.type === "download") {
            const content = pyodide.FS.readFile(message.name, {encoding: "binary"});
            const data = binaryToBase64(content.buffer);
            port.postMessage({data: data});
        }
    });
})

async function init() {
    pyodide = await loadPyodide({
        stdout: (res) => { outputHandler(res); },
        stderr: (res) => { outputHandler(res); },
    });
    await pyodide.loadPackage("micropip");
    await pyodide.loadPackage("matplotlib");
    await pyodide.runPythonAsync(`
        from base64 import b64encode
        from io import BytesIO
        from js import plot_handler
        from os import environ

        environ["MPLBACKEND"] = "AGG"

        from matplotlib import pyplot as plt

        def plot_show():
            buf = BytesIO()
            plt.savefig(buf, format="png")
            buf.seek(0)
            plot_handler(b64encode(buf.read()).decode())
            plt.clf()

        plt.show = plot_show

        def input(*args):
            raise NotImplementedError("'input' is not implemented in JPT")
    `);
    resolve();
}

init();

// Utility functions
function base64ToBinary(content) {
    var binaryString = atob(content);
    var bytes = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

function binaryToBase64(content) {
    let binary = '';
    const bytes = new Uint8Array(content);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
