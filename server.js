const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("processed")) fs.mkdirSync("processed");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 250 * 1024 * 1024 }
});

/* UPLOAD */
app.post("/upload", upload.single("video"), (req, res) => {
  const name = Date.now() + ".mp4";
  fs.writeFileSync("uploads/" + name, req.file.buffer);
  res.json({ file: name });
});

/* EXPORT + DIRECT DOWNLOAD */
app.post("/export", (req, res) => {
  const { file, startTime, xPercent, yPercent, fontSize, padding } = req.body;

  const input = path.join(__dirname, "uploads", file);
  const output = path.join(__dirname, "processed", "CCTV_" + Date.now() + ".mp4");

  ffmpeg(input)
    .videoFilters(
      `drawtext=text='%{pts\\:localtime\\:${startTime / 1000}}':
       x=w*${xPercent}:
       y=h*${yPercent}:
       fontsize=${fontSize}:
       fontcolor=white:
       box=1:
       boxcolor=black:
       boxborderw=${padding}`
    )
    .outputOptions("-movflags faststart")
    .save(output)
    .on("end", () => {
      res.download(output, "CCTV_Processed_Video.mp4", err => {
        if (!err) {
          fs.unlink(output, () => {}); // auto delete after download
        }
      });
    })
    .on("error", e => {
      res.status(500).json({ error: e.message });
    });
});

app.listen(3000, () =>
  console.log("Server running http://localhost:3000")
);
