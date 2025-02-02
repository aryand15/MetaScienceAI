const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, GridFSBucket, ObjectId } = require('mongodb');
const path = require('path');
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
const csurf = require("csurf");
const session = require('express-session');
const flash = require('express-flash');
const axios = require("axios");
const multer = require("multer");
const Grid = require("gridfs-stream");
const { GridFsStorage } = require("multer-gridfs-storage");
const { spawn } = require("child_process");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(cors({
    origin: "http://127.0.0.1:5550", 
    credentials: true                   
}));

const server = http.createServer(app);

const port = 5550;

const MONGO_URI = "mongodb+srv://globesense0:Elm501A!@cluster0.whtiy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const DB_NAME = "researchPDFDB";
const BUCKET_NAME = "pdfs";
const client = new MongoClient(MONGO_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
});


app.get("/search", (req, res) => {
    const userInput = req.query.userInput
    console.log("USER INPUT:", userInput)
    const URL = `https://api.semanticscholar.org/graph/v1/paper/search?query=${userInput}&year=2020-2023&openAccessPdf&fields=title,year,authors,openAccessPdf&limit=5`;
    //const URL = `https://api.semanticscholar.org/graph/v1/paper/search?query=covid19&openAccessPdf&fields=title,year,authors,openAccessPdf&limit=50`
  axios.get(URL)
    .then(response => {
      if (response.status !== 200) {
        return res.json({ "error": "unable to receive data" });
      } else {
        const resultsList = []
        const data = response.data;
        let count = 0;
        data.data.forEach(paper => {
            const paperObj = {};
            paperObj.id = paper.paperId;
            paperObj.title = paper.title;
            paperObj.year = paper.year;
            paperObj.url = paper.openAccessPdf.url;
            console.log(paperObj);
            console.log("COUNT:", ++count);
            resultsList.push(paperObj);
        });
        res.json(resultsList);
      }
    })
    .catch(error => {
      return res.json({ error: "Failed to fetch data from Semantic Scholar API" });
    });
});

app.get("/test", (req, res) => {
    return res.render("index", {});
})

async function getPDFBuffer(fileId) {
  await client.connect();
  const db = client.db(DB_NAME);
  const bucket = new GridFSBucket(db, { bucketName: BUCKET_NAME });

  return new Promise((resolve, reject) => {
      let bufferArray = [];
      const downloadStream = bucket.openDownloadStream(fileId);

      downloadStream.on("data", (chunk) => bufferArray.push(chunk));
      downloadStream.on("end", () => {
          client.close();
          const buffer = Buffer.concat(bufferArray);
          console.log(buffer);
          resolve(buffer); // Convert to a single buffer
      });
      downloadStream.on("error", (err) => {
          client.close();
          reject(err);
      });
  });
}

function analyzePDFWithPython(pdfBuffer) {
  return new Promise((resolve, reject) => {
      const pythonProcess = spawn("python3", ["./py_scripts/analyze_pdf.py"]);

      let output = "";
      pythonProcess.stdout.on("data", (data) => (output+=data.toString()));

      pythonProcess.stderr.on("data", (data) => console.error("Python Error:", data.toString()));

      pythonProcess.on("close", (code) => {
          if (code === 0) {
              resolve(JSON.parse(output)); // Parse extracted insights
          } else {
              reject(new Error("Python script failed"));
          }
      });

      // Send PDF buffer to Python
      pythonProcess.stdin.write(pdfBuffer);
      pythonProcess.stdin.end();
  });
}

async function processPDF(fileId) {
  try {
      const pdfBuffer = await getPDFBuffer(new ObjectId(fileId));
      console.log("BUFFER:", pdfBuffer)
      console.log("PDF retrieved, sending to Python...");

      const extractedInsights = await analyzePDFWithPython(pdfBuffer);
      console.log(extractedInsights);
      return extractedInsights;
  } catch (err) {
      console.error("Error processing PDF:", err);
  }
}

// Example Usage: Pass a valid ObjectId from GridFS
//processPDF("65b43f6c1d2e7a0012a0c1ab");



app.get("/analyze", async (req,res)=>{
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const bucket = new GridFSBucket(db, { bucketName: BUCKET_NAME });
        const filesCollection = db.collection(`${BUCKET_NAME}.files`);

        // Get all files stored in the bucket
        const files = await filesCollection.find({}).toArray();
        const allAnalysisResults = [];
        for (const file of files) {
            const result = await processPDF(file._id);
            allAnalysisResults.push(result);
        }
        res.json(allAnalysisResults);
    } catch (e) {
        console.log(e)
    }
    

})




async function uploadMultiplePDFs(pdfList) {
    //const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const bucket = new GridFSBucket(db, { bucketName: BUCKET_NAME });

        console.log(`Starting upload of ${pdfList.length} PDFs...`);

        const uploadPromises = pdfList.map(async (metadata) => {
            try {
                console.log(`Downloading: ${metadata.title}`);

                const response = await axios.get(metadata.url, { responseType: 'stream' });

                const uploadStream = bucket.openUploadStream(metadata.title, { metadata });
                response.data.pipe(uploadStream);

                return new Promise((resolve, reject) => {
                    uploadStream.on("finish", () => {
                        console.log(`Uploaded: ${metadata.title} (ID: ${uploadStream.id})`);
                        resolve(uploadStream.id);
                    });

                    uploadStream.on("error", (error) => {
                        console.error(`Upload failed for ${metadata.title}:`, error);
                        reject(error);
                    });
                });

            } catch (error) {
                console.error(`Failed to process ${metadata.title}:`, error);
            }
        });

        await Promise.all(uploadPromises);
        console.log("All uploads complete.");

    } finally {
        await client.close();
    }
}




app.post("/upload", (req, res) => {
    // Example List of PDFs with Metadata
    /*const pdfsToUpload = [
        {
            id: "25f593568fcd4cd2d9ea078c12abd194359a25e3",
            title: "Spherical Atomic Norm-Inspired Approach...",
            year: 2023,
            url: "https://www.mdpi.com/2076-3417/13/5/3067/pdf?version=1677576913"
        },
        {
            id: "8e23bfe2d1c147b98e4c102ea20bd5812f3a9bc7",
            title: "Advances in Deep Learning for Biomedical Imaging",
            year: 2022,
            url: "https://arxiv.org/pdf/2107.02302.pdf"
        }
    ];*/
    console.log("REQUEST BODY:", req.body);
    const pdfsToUpload = req.body;
    console.log(pdfsToUpload);

    // Upload Multiple PDFs
    uploadMultiplePDFs(pdfsToUpload)
    .then(() => {
        console.log("successful upload");
        res.status(200).send("Successful upload");
    })
    .catch((err) => console.error("Error:", err));
});




server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});




