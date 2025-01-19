function getSelectionText() {
  var text = "";
  if (window.getSelection) {
    text = window.getSelection().toString();
  } else if (document.selection && document.selection.type !== "Control") {
    text = document.selection.createRange().text;
  }
  return text;
}

function clearSelection() {
  if (window.getSelection) {
    window.getSelection().removeAllRanges();
  } else if (document.selection) {
    document.selection.empty();
  }
}
function update() {
  chrome.runtime.sendMessage({
    type: "add_to_recording",
    text: getSelectionText(),
    url: document.URL,
  });
  clearSelection();
}

window.onkeyup = (event) => {
  if (event.shiftKey && event.key === "Enter") {
    update();
  }
};
