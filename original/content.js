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