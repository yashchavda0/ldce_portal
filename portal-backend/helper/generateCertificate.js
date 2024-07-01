const fs = require("fs");
const path = require("path");
const Docxtemplater = require("docxtemplater");
const pizZip = require("pizzip");
const mammoth = require("mammoth");
const puppeteer = require('puppeteer');
const { PDFDocument, rgb } = require('pdf-lib');
const ImageModule = require('docxtemplater-image-module');


// Function to convert Word buffer to HTML
function convertWordToHTML(wordBuffer) {
  return mammoth.convertToHtml({ buffer: wordBuffer })
    .then(result => result.value)
    .catch(error => {
      console.error("Error converting Word to HTML:", error);
      throw error;
    });
}


// Function to convert HTML to PDF
async function convertHTMLToPDF(html) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  const pdfBuffer = await page.pdf({
    format: 'Letter',
    printBackground: true,
  });
  await browser.close();
  return pdfBuffer;
}

function imageToBase64(path) {
  return fs.readFileSync(path, { encoding: 'base64' });
}

const generate = async (filename, values, res) => {
  console.log("generate function called");
  console.log(values);
  const filesFolderPath = path.join(__dirname, "../uploads/certificateFormat/bonafide_certificate.docx");
  const filePath = path.join(filesFolderPath);
  const content = fs.readFileSync(filePath, "binary");
  const zip = new pizZip(content);

  const opts = {
    centered: false,
    getImage: function (tagValue) {
      // Assuming tagValue is a base64 string
      return Buffer.from(tagValue, 'base64');
    },
    getSize: function (img, tagValue) {
      // Return your desired image size [width, height]
      return [150, 150];
    }
  };
  const imageModule = new ImageModule(opts);
  const doc = new Docxtemplater(zip, { modules: [imageModule] });

  // Convert your image to base64
  const imagePath = path.join(__dirname, '../uploads/210280116005-1719639879901.jpg');
  const imageBase64 = imageToBase64(imagePath);
  console.log(imageBase64, "imageBase64");

  console.log("doc created");
  doc.setData({
    enrollment: values.enrollment,
    name: values.firstName + " " + values.lastName,
    residentalAddress: values.residentalAddress,
    permanentAddress1: values.permanentAddress1,
    contactNumber: values.contactNumber,
    Branch: values.branch,
    // image: imageBase64,
  });
  console.log("data set");

  try {
    doc.render();
  } catch (error) {
    const e = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      properties: error.properties,
    };
    console.log(JSON.stringify({ error: e }));
    throw error;
  }
  console.log("doc rendered");

  const buf = doc.getZip().generate({ type: "nodebuffer" });

  // Convert DOCX buffer to HTML
  const html = await convertWordToHTML(buf);

  // Convert HTML to PDF
  const pdfBuffer = await convertHTMLToPDF(html);

  console.log("PDF generated");
  return pdfBuffer;
};

const generate1 = async (filename, values, enrollment, requestId) => {
  console.log("generate function called");
  console.log(values);
  const filesFolderPath = path.join(__dirname, "../uploads/certificateFormat/");
  const filePath = path.join(filesFolderPath, filename);
  const content = fs.readFileSync(
    filePath, "binary"
  );

  // console.log(content);
  const zip = new pizZip(content);

  const doc = new Docxtemplater(zip);
  console.log("doc created");
  doc.setData(values);
  console.log("data set");

  try {
    doc.render();
  } catch (error) {
    const e = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      properties: error.properties,
    };
    console.log(JSON.stringify({ error: e }));
    throw error;
  }
  console.log("doc rendered");
  const publicFolder = path.join(__dirname, "../public")
  const filePaths = path.join(publicFolder, `${enrollment}-${requestId}.docx`);

  const buf = doc.getZip().generate({ type: "nodebuffer" });
  console.log("buf generated");
  fs.writeFile(filePaths, buf, (err) => {
    console.log(err)
  })
  return buf


  //  console.log(output)
  // fs.writeFileSync("./write.pdf",output.data)
  //  return output  


};

module.exports = { generate, generate1 };
