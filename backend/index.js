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
const puppeteer = require('puppeteer');
//Schema Imports
const Project = require("./models/Project.js")
const User = require("./models/User.js")

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(cors({
    origin: ["http://localhost:5550", "http://127.0.0.1:5550"],
    credentials: true                   
}));

const server = http.createServer(app);

const port = 5550;

const MONGO_URI = "mongodb+srv://globesense0:Elm501A!@cluster0.whtiy.mongodb.net/researchPDFDB?retryWrites=true&w=majority";
const DB_NAME = "researchPDFDB";  
const BUCKET_NAME = "pdfs";
const client = new MongoClient(MONGO_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
});

app.get("/create-project", (req,res)=>{
    
})

app.get("/:project_id/formulate-question", (req, res) => {

})

app.get("/:project_id/select-variables", (req, res) => {

})

app.post("/project", async (req, res) => {    // Route to create a new project
    const projectData = req.body;
    mongoose.connect(MONGO_URI);
    try{
        const newProject = new Project(projectData);
        await newProject.save()
        console.log(newProject);
        console.log(newProject?._id);
        res.status(201).json({ message: "Project created successfully", projectId: newProject._id });
    } catch (error) {
        res.status(500).json({ message: "Error creating project", error });
    }


})

app.put("/project/:project_id", async(req, res) => {     // Route to update existing project
    mongoose.connect(MONGO_URI);
    try{
        const project = await Project.findOneAndUpdate(
            {_id: req.params.project_id},
            { $set: req.body},
            { new: true }
        );
        res.status(201).json({ message: "Project updated successfully", projectId: newProject._id });
    } catch (error) {
        res.status(500).json({ message: "Error updating project", error });
    }
})



app.post("/select-and-save-papers/:project_id", async (req, res) => {
    // PUT "/project/:project_id" with filters & question to save to db
    mongoose.connect(MONGO_URI);
    try {
        const project = await Project.findOneAndUpdate(
            {_id: req.params.project_id},
            { $set: req.body},
            { new: true }
        );


        //query db, set vars, get keywords based on name, desc, question
     
        // feed keywords into api to get list of pdfs
        const URL = `https://api.semanticscholar.org/graph/v1/paper/search?query=${project.research_question}&year=${project.filters.yearRange.startYear}-${project.filters.yearRange.endYear}&openAccessPdf&minCitationCount=${project.filters.minCitationCount}&fieldsOfStudy=${project.research_domain}&publicationTypes=${project.filters.publicationTypes.join(",")}&fields=title,year,openAccessPdf&limit=${project.filters.paperCount}`;
        console.log("API URL:", URL);
        const pdfsToUpload = []
        axios.get(URL)
        .then(response => {
        if (response.status !== 200) {
            console.log("semantic scholar api didn't work")
            return res.status(500).json({message: "unable to receive data" });
        } else {
            const data = response.data;
            let count = 0;
            console.log(data.data)
            data.data.forEach(paper => {
                const paperObj = {};
                paperObj.id = paper.paperId;
                paperObj.title = paper.title;
                paperObj.year = paper.year;
                paperObj.url = paper.openAccessPdf.url;
                console.log(paperObj);
                console.log("COUNT:", ++count);
                pdfsToUpload.push(paperObj);
            });
            console.log("pdfsToUpload",pdfsToUpload,req.params.project_id);

            // Upload Multiple PDFs
            uploadMultiplePDFs(pdfsToUpload, req.params.project_id)
            .then(() => {
                console.log("successful upload");
                res.status(200).send("Successful upload");
            })
            .catch((err) => console.error("Error:", err));
        }})
    } catch (error) {
        return res.status(500).json({ message: "Error updating project", error });
    }
})

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


async function downloadPDF(bucket, project_id, browser, metadata) {
    try {
        console.log("About to open new page");
        const page = await browser.newPage();
        console.log("Browser page opened");

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

        console.log(`Navigating to ${metadata.url}...`);
        
        await page.goto(metadata.url, {
            waitUntil: 'networkidle2',
            timeout: 20000 // Set a timeout of 20 seconds to prevent indefinite waits
        });

        console.log('Page loaded.');

        // Generate PDF buffer
        const pdfBuffer = await page.pdf();
        
        // Create upload stream
        const uploadStream = bucket.openUploadStream(metadata.title, { metadata, project_id });

        return new Promise((resolve, reject) => {
            uploadStream.write(pdfBuffer, (err) => {
                if (err) {
                    console.error(`Upload failed for ${metadata.title}:`, err);
                    reject(err);
                }
            });

            uploadStream.end();
            
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
        console.error(`Error downloading ${metadata.title}:`, error.message);
        return null; // Return null so failed PDFs are skipped, not blocking others
    }
}



async function uploadMultiplePDFs(pdfList, project_id) {
    const { default: pLimit } = await import("p-limit");
    const limit = pLimit(5); // Limit concurrency to 5

    
    const browser = await puppeteer.launch({ headless: true });
    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const bucket = new GridFSBucket(db, { bucketName: BUCKET_NAME });

        console.log(`Starting upload of ${pdfList.length} PDFs...`);

        // Create an array of promises for concurrent downloads/uploads
        const uploadPromises = pdfList.map(metadata =>
            limit(() => downloadPDF(bucket, project_id, browser, metadata))
        );

        // Wait for all downloads/uploads to finish
        const results = await Promise.all(uploadPromises);

        // Filter out failed downloads (null values)
        const successfulUploads = results.filter(id => id !== null);
        
        console.log(`✅ Successfully uploaded ${successfulUploads.length}/${pdfList.length} PDFs`);
        
    } catch (error) {
        console.error("Error in uploadMultiplePDFs:", error);
    } finally {
        await browser.close();
        await client.close();
        console.log("Browser and DB connections closed.");
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




