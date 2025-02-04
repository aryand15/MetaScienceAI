/*const { MongoClient, ServerApiVersion, GridFSBucket, ObjectId } = require('mongodb');
const axios = require("axios");
const MONGO_URI = "mongodb+srv://globesense0:Elm501A!@cluster0.whtiy.mongodb.net/researchPDFDB?retryWrites=true&w=majority";
const BUCKET_NAME = "pdfs";
const DB_NAME = "researchPDFDB";  


const client = new MongoClient(MONGO_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
});

const metadata = {
    id: "3e7052fbccf1172b843a1d6747a2f3d35173c5f0",
    title:
      "The Early Influence and Effects of the Coronavirus Disease 2019 (COVID-19) Pandemic on Resident Education and Adaptations",
    year: 2020,
    url: "http://www.jacr.org/article/S154614402030781X/pdf",
};


async function download() {
  await client.connect();
  const db = client.db(DB_NAME);
  const bucket = new GridFSBucket(db, { bucketName: BUCKET_NAME });
  const project_id = "67a16879adcb4cc06f6d10fb";

 

  try {
    
    console.log(`Downloading: ${metadata.title}`);

    const response = await axios.get(metadata.url, {
      responseType: "",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        Accept:
          ,
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
      },
    });

    const uploadStream = bucket.openUploadStream(
      metadata.title,
      { metadata },
      project_id
    );
    response.data.pipe(uploadStream);

    const uploadPromises = new Promise((resolve, reject) => {
      uploadStream.on("finish", () => {
        console.log(`Uploaded: ${metadata.title} (ID: ${uploadStream.id})`);
        resolve(uploadStream.id);
      });

      uploadStream.on("error", (error) => {
        console.error(`Upload failed for ${metadata.title}:`);
        reject(error);
      });
    });
    await Promise.all(uploadPromises);
    console.log("All uploads complete.");
  } catch (error) {
    console.error(`Failed to process ${metadata.title}:`, error);
  }
}

download();*/

const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
    
  // Set a realistic User-Agent if needed
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                            'Chrome/115.0.0.0 Safari/537.36');
    console.log(`Navigating...`);
  await page.goto('https://www.jacr.org/article/S154614402030781X/pdf', {
    
    waitUntil: 'networkidle2'
  });
  console.log('Page loaded.');
  

  // Optionally, wait for the PDF content or a specific element to load
  // Save the PDF to a file (if it is rendered as a PDF in the browser)
  const pdfBuffer = await page.pdf();
  (await page.createPDFStream()).pipeTo()

  const fs = require('fs');
  fs.writeFileSync('downloaded.pdf', pdfBuffer);
  console.log("PDF downloaded.")

  await browser.close();
  console.log("Browser closed.")
})();