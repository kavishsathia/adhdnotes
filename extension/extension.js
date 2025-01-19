async function fetchState() {
  let is_recording = await chrome.runtime.sendMessage({ type: "is_recording" });
  if (is_recording) {
    let urls = await chrome.runtime.sendMessage({ type: "get_urls" });
    for (let i = 0; i < urls[0].length; i++) {
      console.log(urls);
      document.getElementById("sitelist").innerHTML +=
        "<tr><td>" +
        urls[0][i] +
        "</td>" +
        "<td style='text-align: right;'>" +
        urls[1][i] +
        "</td>" +
        "</tr>";
    }
    stop_screen();
  } else {
    start_recording_screen();
  }
}

function start_recording_screen() {
  document.getElementById("stop_recording").style.display = "none";
  document.getElementById("start_recording").style.display = "block";
  document.getElementById("save").style.display = "none";
}

function save_screen() {
  document.getElementById("stop_recording").style.display = "none";
  document.getElementById("start_recording").style.display = "none";
  document.getElementById("save").style.display = "block";
}

function stop_screen() {
  document.getElementById("stop_recording").style.display = "block";
  document.getElementById("start_recording").style.display = "none";
  document.getElementById("save").style.display = "none";
}

document.getElementById("stop_recording").addEventListener("click", (res) => {
  chrome.runtime.sendMessage({ type: "stop_recording" });
  save_screen();
});

document.getElementById("start_recording").addEventListener("click", (res) => {
  chrome.runtime.sendMessage({ type: "start_recording" });
  stop_screen();
});

document.getElementById("submit").addEventListener("click", async (res) => {
  const parent = await chrome.runtime.sendMessage({
    type: "submit",
  });

  document.getElementById("caption").innerText = "Your file has been stored";
  start_recording_screen();
});

document.getElementById("cancel").addEventListener("click", async (res) => {
  chrome.runtime.sendMessage({
    type: "cancel",
  });
  start_recording_screen();
});

fetchState();
