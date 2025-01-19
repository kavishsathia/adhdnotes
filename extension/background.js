text = {};
is_recording = false;

function add_to_recording(pageUrl, selectionText) {
  if (is_recording) {
    let url = new URL(pageUrl).hostname;
    if (text[url] !== undefined) {
      text[url] = text[url] + selectionText;
    } else {
      text[url] = selectionText;
    }
  }
}

chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (request.type === "is_recording") {
    sendResponse(is_recording);
  } else if (request.type === "start_recording") {
    text = {};
    is_recording = true;
  } else if (request.type === "stop_recording") {
    is_recording = false;
  } else if (request.type === "get_urls") {
    let values = Object.values(text);
    values.forEach(
      (value, index, array) => (array[index] = value.split(" ").length - 1)
    );
    sendResponse([Object.keys(text), values]);
  } else if (request.type === "add_to_recording") {
    add_to_recording(request.url, request.text);
  } else if (request.type === "submit") {
    let merged = "";
    let values = Object.values(text);

    for (let i = 0; i < values.length; i++) {
      merged += values[i];
    }

    const res = await fetch("http://localhost:8080/file/web-clip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: merged }),
    });

    const parent = await res.json();
    sendResponse(parent);
  } else if (request.type === "cancel") {
    text = {};
    is_recording = false;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    title: "Add to Recording (Shift + Enter)",
    contexts: ["selection"],
    id: "add",
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  add_to_recording(info.pageUrl, info.selectionText);
});
