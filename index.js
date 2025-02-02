const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, GridFSBucket } = require('mongodb');
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


app.get("/search", (req, res) => {
    const userInput = req.params.userInput
    const URL = `https://api.semanticscholar.org/graph/v1/paper/search?query=${userInput}&year=2020-2023&openAccessPdf&fields=title,year,authors,openAccessPdf&limit=5`;

  axios.get(URL)
    .then(response => {
      if (response.status !== 200) {
        return res.json({ "error": "unable to receive data" });
      } else {
        const resultsList = []
        const data = response.data;
        data.data.forEach(paper => {
            const paperObj = {};
            paperObj.id = paper.paperId;
            paperObj.title = paper.title;
            paperObj.year = paper.year;
            paperObj.url = paper.openAccessPdf.url;
            console.log(paperObj);
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


const MONGO_URI = "mongodb+srv://globesense0:Elm501A!@cluster0.whtiy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const DB_NAME = "researchPDFDB";
const BUCKET_NAME = "pdfs";

async function uploadMultiplePDFs(pdfList) {
    const client = new MongoClient(MONGO_URI);
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
    .then(() => res.status(200))
    .catch((err) => console.error("Error:", err));
});




server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


const uri = "mongodb+srv://globesense0:Elm501A!@cluster0.whtiy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
/*const uri = "mongodb+srv://globesense0:Elm501A!@cluster0.whtiy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Initialize mongoose connection to MongoDB
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    const connection = mongoose.connection;
    connection.once("open", () => {
      gfs = Grid(connection.db, mongoose.mongo);
      gfs.collection("papers");
      console.log("Connected to MongoDB and GridFS initialized.");
    });
  })
  .catch(err => console.log("Error connecting to MongoDB:", err));

// Initialize GridFS Storage for multer
const storage = new GridFsStorage({
  url: uri,
  file: (req, file) => {
    return {
      filename: `${Date.now()}_${file.originalname}`,
      bucketName: "papers",
      metadata: {
        title: req.body.title,
        author: req.body.author,
        doi: req.body.doi,
        year: req.body.year
      }
    };
  }
});
const upload = multer({ storage });*/
