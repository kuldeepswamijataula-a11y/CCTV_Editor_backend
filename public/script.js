let uploadedFile = "";
let startDate = null;

const video = document.getElementById("video");
const ts = document.getElementById("timestamp");

/* UPLOAD */
document.getElementById("videoFile").onchange = async e => {
  const form = new FormData();
  form.append("video", e.target.files[0]);

  const res = await fetch("/upload", {
    method: "POST",
    body: form
  });

  const data = await res.json();
  uploadedFile = data.file;
  video.src = "/uploads/" + uploadedFile;
};

/* RUNNING TIMESTAMP */
video.ontimeupdate = () => {
  if (!startDate) return;
  const t = new Date(startDate.getTime() + video.currentTime * 1000);
  ts.innerText = t.toLocaleString();
};

/* START DATE */
document.getElementById("startTime").onchange = e => {
  startDate = new Date(e.target.value);
};

/* DRAG TIMESTAMP */
let drag = false, offsetX = 0, offsetY = 0;

ts.onmousedown = e => {
  drag = true;
  offsetX = e.offsetX;
  offsetY = e.offsetY;
};

document.onmousemove = e => {
  if (!drag) return;
  const box = document.getElementById("videoBox").getBoundingClientRect();
  ts.style.left = e.clientX - box.left - offsetX + "px";
  ts.style.top = e.clientY - box.top - offsetY + "px";
};

document.onmouseup = () => (drag = false);

/* EXPORT → DIRECT DOWNLOAD */
async function exportVideo() {
  const box = document.getElementById("videoBox").getBoundingClientRect();
  const tsBox = ts.getBoundingClientRect();

  const xPercent = (tsBox.left - box.left) / box.width;
  const yPercent = (tsBox.top - box.top) / box.height;

  const res = await fetch("/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file: uploadedFile,
      startTime: startDate.getTime(),
      xPercent,
      yPercent,
      fontSize: document.getElementById("fontSize").value,
      padding: document.getElementById("boxPadding").value
    })
  });

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "CCTV_Processed_Video.mp4";
  document.body.appendChild(a);
  a.click();

  a.remove();
  window.URL.revokeObjectURL(url);
}
