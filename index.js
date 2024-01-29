const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;
const datasetPath = "./dataset.csv";

app.use(cors());

const downsampleMean = (data, targetSize) => {
  const downsampled = [];
  const intervalSize = Math.ceil(data.length / targetSize);
  for (let i = 0; i < data.length; i += intervalSize) {
    const intervalEnd = Math.min(i + intervalSize, data.length);
    const intervalData = data.slice(i, intervalEnd);
    const meanValue =
      intervalData.length > 0
        ? intervalData.reduce(
            (sum, entry) => sum + parseFloat(entry["Profit Percentage"]),
            0
          ) / intervalData.length
        : 0;
    downsampled.push({
      Timestamp: data[i].Timestamp,
      "Profit Percentage": meanValue,
    });
  }
  return downsampled;
};

app.get("/", (req, res) => {
  res.status(200).send("Backend is running!");
});

app.get("/api/downsampled-dataset-mean", (req, res) => {
  const targetSize = 100;
  const data = [];
  try {
    fs.createReadStream(datasetPath)
      .pipe(csv())
      .on("data", (row) => {
        data.push(row);
      })
      .on("end", () => {
        const downsampledData = downsampleMean(data, targetSize);
        res.status(200).send(downsampledData);
      });
  } catch (error) {
    console.log("Error reading CSV file:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
