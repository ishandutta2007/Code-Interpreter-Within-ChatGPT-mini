import { render } from 'preact'
import '../base.css'
// import { getUserConfig, Theme } from '../config'
import { detectSystemColorScheme, base64ToBinary, binaryToBase64 } from '../utils'
// import ChatGPTContainer from './ChatGPTContainer'
// import Global from './Global'
// import { config, SearchEngine } from './search-engine-configs'
import './styles.scss'
// import { getPossibleElementByQuerySelector } from './utils'

// import 'codemirror/lib/codemirror.js'

// const siteRegex = new RegExp(Object.keys(config).join('|'))
// let siteName
// try {
//   siteName = location.hostname.match(siteRegex)![0]
// } catch (error) {
//   siteName = location.pathname.match(siteRegex)![0]
// }
// const siteConfig = config[siteName]

// let container = document.createElement('div')

// async function mount(question: string, promptSource: string, siteConfig: SearchEngine) {
//   container.className = 'chat-gpt-container'

//   const userConfig = await getUserConfig()
//   let theme: Theme
//   if (userConfig.theme === Theme.Auto) {
//     theme = detectSystemColorScheme()
//   } else {
//     theme = userConfig.theme
//   }
//   if (theme === Theme.Dark) {
//     container.classList.add('gpt-dark')
//   } else {
//     container.classList.add('gpt-light')
//   }

//   const siderbarContainer = getPossibleElementByQuerySelector('code.hljs.language-python') //siteConfig.sidebarContainerQuery)
//   // console.log('siderbarContainer', siderbarContainer)
//   if (siderbarContainer) {
//     siderbarContainer.append(container)
//   }
//   // else {
//   //   container.classList.add('sidebar-free')
//   //   const appendContainer = getPossibleElementByQuerySelector(siteConfig.appendContainerQuery)
//   //   // console.log('appendContainer', appendContainer)
//   //   if (appendContainer) {
//   //     appendContainer.appendChild(container)
//   //   }
//   // }

//   console.log('props at index(mount):', question, promptSource, userConfig.triggerMode)

//   render(
//     // <ChatGPTContainer
//     //   question={question}
//     //   promptSource={promptSource}
//     //   triggerMode={userConfig.triggerMode || 'always'}
//     // />
//     <div>Hello</div>,
//     container,
//   )
// }

// let last_query_time = 1
// async function render_already_mounted(
//   question: string,
//   promptSource: string,
//   siteConfig: SearchEngine,
// ) {
//   console.log('props at index(render_already_mounted):', question, promptSource)
//   container = document.createElement('div')
//   const allps = document.querySelectorAll('.chat-gpt-container') //#gpt-answer")
//   allps[allps.length - 1].appendChild(container)

//   // const nav_buts = document.querySelectorAll('nav button')
//   // const ids = nav_buts[nav_buts.length - 1].textContent.split(',')
//   // console.log('ids from html', ids);
//   const contextIds = Global.contextIds //[ids[0], ids[1], ids[2]]
//   const requestParams = {}
//   requestParams.atValue = Global.atValue //ids[3]
//   requestParams.blValue = Global.blValue //ids[4]
//   console.log('contextIds', contextIds)
//   console.log('requestParams', requestParams)
//   last_query_time = Date.now()

//   render(
//     <ChatGPTContainer
//       question={question}
//       contextIds={contextIds}
//       requestParams={requestParams}
//       promptSource={promptSource}
//       triggerMode={'always'}
//     />,
//     container,
//   )
// }

// const getSiblings = (elm, withTextNodes) => {
//   if (!elm || !elm.parentNode) return
//   const siblings = [...elm.parentNode[withTextNodes ? 'childNodes' : 'children']],
//     idx = siblings.indexOf(elm)
//   siblings.before = siblings.slice(0, idx)
//   siblings.after = siblings.slice(idx + 1)
//   return siblings
// }

// window.onload = function () {
//   console.log('Page load completed')
//   // const textarea = document.getElementById('prompt-textarea')
//   // const text_entered_button = getSiblings(textarea).after[0]
//   // if (text_entered_button.tagName == 'BUTTON') {
//   //   text_entered_button.addEventListener('click', (event) => {
//   //     console.log('Pressed: ' + text_entered_button.tagName)
//   //     console.log('Now button press to enter(keydown) conversion step', event)
//   //     textarea.dispatchEvent(
//   //       new KeyboardEvent('keydown', {
//   //         bubbles: true,
//   //         cancelable: true,
//   //         isTrusted: true,
//   //         key: 'Enter',
//   //         code: 'Enter',
//   //         location: 0,
//   //         ctrlKey: false,
//   //       }),
//   //     )
//   //     return false
//   //   })
//   // }

//   // textarea.addEventListener('keydown', (event) => {
//   //   if (event.key === 'Enter') {
//   //     event.preventDefault() // Prevent the default Enter key behavior (e.g., line break)
//   //     const text = event.target.value
//   //     console.log('Enter key pressed! Text: ' + text)
//   //     const bodyInnerText = text.trim().replace(/\s+/g, ' ').substring(0, 1500)
//   //     console.log('final prompt:', bodyInnerText)
//   //     const gpt_container = document.querySelector('div.chat-gpt-container')
//   //     if (!gpt_container) mount(bodyInnerText, 'default', siteConfig)
//   //     else render_already_mounted(bodyInnerText, 'default', siteConfig)
//   //     if (gpt_container) {
//   //       gpt_container.scroll({ top: gpt_container.scrollHeight, behavior: 'smooth' })
//   //     }
//   //   }
//   // })
// }

// window.setInterval(function () {
//   console.log(
//     'times=',
//     Date.now(),
//     last_query_time,
//     Date.now() - last_query_time < 19000,
//     Global.done,
//   )
//   if (Date.now() - last_query_time < 19000 && Global.done == true) {
//     const gpt_container = document.querySelector('div.chat-gpt-container')
//     gpt_container.scroll({ top: gpt_container.scrollHeight, behavior: 'smooth' })
//     Global.done = false
//   }
// }, 5000)





const TIMEOUT = 500;
const PYTHON_CODEBLOCK = "code.hljs.language-python";

class Hook {
    element;
}

let nextHook = new Hook();
let mainHook = new Hook();
let formHook = new Hook();
let chatHook = new Hook();

const observerOptions = { childList: true };
const nextHookObserver = new MutationObserver(nextHookHandler);
const mainHookObserver = new MutationObserver(mainHookHandler);
const formHookObserver = new MutationObserver(formHookHandler);

const hookGraph = new WeakMap();
hookGraph.set(nextHook, [mainHook]);
hookGraph.set(mainHook, [chatHook, formHook]);  // note the ordering
hookGraph.set(formHook, []);
hookGraph.set(chatHook, []);

const hookInit = new WeakMap();
hookInit.set(nextHook, initNextHook);
hookInit.set(mainHook, initMainHook);
hookInit.set(formHook, initFormHook);
hookInit.set(chatHook, initChatHook);

const hookHandler = new WeakMap();
hookHandler.set(nextHook, nextHookHandler);
hookHandler.set(mainHook, mainHookHandler);
hookHandler.set(formHook, formHookHandler);

const hookObserver = new WeakMap();
hookObserver.set(nextHook, nextHookObserver);
hookObserver.set(mainHook, mainHookObserver);
hookObserver.set(formHook, formHookObserver);

function initNextHook() {
    nextHook.element = document.getElementById("__next");
    return nextHook.element;
}

function initMainHook() {
    mainHook.element = document.querySelector("main");
    return mainHook.element;
}

function initFormHook() {
    formHook.element = document.querySelector("form")?.firstChild;
    if (formHook.element) {
        initCodeAreas();
    }
    return formHook.element;
}

function initChatHook() {
    chatHook.element = document.querySelector("main")
                        ?.childNodes[1]
                        ?.firstChild
                        ?.firstChild
                        ?.firstChild;
    return chatHook.element;
}

function _initHooks(hook) {
    const init = hookInit.get(hook);
    if (!init()) {
        return false;
    }
    for (const nextHook of hookGraph.get(hook)) {
        if (!_initHooks(nextHook)) {
            return false;
        }
    }
    return true;
}

function initHooks(hook, retryFunction=nextHookHandler) {
    if (!_initHooks(hook)) {
        setTimeout(retryFunction, TIMEOUT);
        return;
    }
    startObservers(hook);
}

function nextHookHandler() {
    initHooks(nextHook, nextHookHandler);
}

function mainHookHandler() {
    initHooks(mainHook, mainHookHandler);
}

function formHookHandler() {
    const button = formHook.element.querySelector("button")
                                    ?.firstChild
                                    ?.lastChild;
    if (button && button.textContent === "Regenerate response") {
        initCodeAreas();
    }
}

function startObservers(hook) {
    stopObservers(hook);
    if (hookObserver.has(hook)) {
        const obs = hookObserver.get(hook);
        obs.observe(hook.element, observerOptions);
    }
    for (const childHook of hookGraph.get(hook)) {
        startObservers(childHook);
    }
}

function stopObservers(hook) {
    if (hookObserver.has(hook)) {
        const obs = hookObserver.get(hook);
        obs.disconnect();
    }
    for (const childHook of hookGraph.get(hook)) {
        stopObservers(childHook);
    }
}

function initCodeArea(codeElement) {
    console.log("codeElement:", codeElement)
    const toolbarElement = codeElement.parentElement?.parentElement?.firstChild;
    console.log("toolbarElement of codeElement:")
    console.log(toolbarElement)
    if (!toolbarElement) {
        return;
    }

    // Remove what is currently on the toolbar, we want to create our own
    while (toolbarElement.hasChildNodes()) {
        toolbarElement.lastChild?.remove();
    }
    console.log("toolbarElement after Removal:")
    console.log(toolbarElement)

    const jpt = document.createElement("span");
    jpt.innerHTML = "CIGPT"

    const runCodeButton = document.createElement("button");
    runCodeButton.classList.add("flex", "ml-auto", "gap-1");
    runCodeButton.innerHTML += '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
    runCodeButton.innerHTML += "Run";

    let codeOutput;
    runCodeButton.addEventListener("click", async () => {
        if (codeElement.textContent) {
            if (!codeOutput) {
                codeOutput = document.createElement("div");
                codeOutput.classList.add("bg-black", "rounded-md", "mb-4", "p-4", "overflow-y-auto");
                codeOutput.style.color = "white";
                codeElement.parentElement?.parentElement?.parentElement?.appendChild(codeOutput);
            }
            
            const port = chrome.runtime.connect();
            port.postMessage({
                type: "execute",
                data: codeElement.textContent,
            });
            port.onMessage.addListener((message) => {
                if (message.type === "text") {
                    // prevent rendering as html
                    const data = message.data.replace(/</g, "&lt");
                    codeOutput.innerHTML += data + "\n";
                } else if (message.type === "png") {
                    const image = document.createElement("img");
                    image.style.margin = "0";
                    image.style.padding = "0";
                    image.src = message.data;
                    codeOutput.appendChild(image);
                } else {

                }
            });
            codeOutput.innerHTML = "";
        }
    });

    let codeMirror;
    let editor;
    let editing = false;

    const editCodeButton = document.createElement("button");
    editCodeButton.classList.add("flex", "ml-auto", "gap-1");
    editCodeButton.innerHTML += '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="16 3 21 8 8 21 3 21 3 16 16 3"></polygon></svg>';
    editCodeButton.innerHTML += "Edit";
    editCodeButton.addEventListener("click", () => {
        if (!editing) {
            editing = true;
            
            editor = document.createElement("div");
            const editorParent = codeElement.parentElement.parentElement;
            editorParent.replaceChild(editor, codeElement.parentElement);

            codeMirror = CodeMirror(editor, {
                value: codeElement.textContent,
                mode: "python",
            });
            codeMirror.setSize("100%", "100%");
        } else {
            editing = false;
            
            codeElement.textContent = codeMirror.getValue();
            hljs.highlightElement(codeElement);

            const editorParent = editor.parentElement;
            editorParent.replaceChild(codeElement.parentElement, editor);
        }
    });

    // We make our own copy button since the original one has
    // some functionality that we do not want
    const copyCodeButton = document.createElement("button");
    copyCodeButton.classList.add("flex", "ml-auto", "gap-1");
    copyCodeButton.innerHTML += '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>';
    copyCodeButton.innerHTML += "Copy";
    // TODO: add some indicator that the copy was successful
    copyCodeButton.addEventListener("click", () => {
        if (codeElement.textContent) {
            navigator.clipboard.writeText(codeElement.textContent);
        }
    });

    const uploadFileButton = document.createElement("button");
    uploadFileButton.classList.add("flex", "ml-auto", "gap-1");
    uploadFileButton.innerHTML += '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 3v5h5M12 18v-6M9 15h6"/></svg>';
    uploadFileButton.innerHTML += "Upload";
    uploadFileButton.addEventListener("click", async () => {
        const [fileHandle] = await window.showOpenFilePicker();
        const file = await fileHandle.getFile();
        const binary = await file.arrayBuffer();
        const data = binaryToBase64(binary);

        const port = chrome.runtime.connect();
        port.postMessage({
            type: "upload",
            name: fileHandle.name,
            data: data,
        });
    });

    // TODO: create a menu to select file to download
    const downloadFileButton = document.createElement("button");
    downloadFileButton.classList.add("flex", "ml-auto", "gap-1");
    downloadFileButton.innerHTML += '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 3v5h5M12 18v-6M9 15h6"/></svg>';
    downloadFileButton.innerHTML += "Download";
    downloadFileButton.addEventListener("click", async () => {
        const fileHandle = await window.showSaveFilePicker();
        const name = fileHandle.name;

        const port = chrome.runtime.connect();
        port.postMessage({
            type: "download",
            name: name,
        });
        port.onMessage.addListener(async (message) => {
            const writeStream = await fileHandle.createWritable();
            const data = base64ToBinary(message.data);
            await writeStream.write(data);
            await writeStream.close();
        });
    });

    const toolbar = [
        jpt,
        runCodeButton,
        editCodeButton,
        copyCodeButton,
        uploadFileButton,
        downloadFileButton,
    ]
    for (const content of toolbar) {
        if (content) {
            toolbarElement.appendChild(content);
        }
    }
}

function initCodeAreas() {
    if (!chatHook) {
        return;
    }
    console.log("Searching doms:", PYTHON_CODEBLOCK)
    const codeElements = chatHook.element.querySelectorAll(PYTHON_CODEBLOCK);
    console.log("found doms:", codeElements)
    for (const codeElement of codeElements) {
        initCodeArea(codeElement);
    }
}

initHooks(nextHook);

