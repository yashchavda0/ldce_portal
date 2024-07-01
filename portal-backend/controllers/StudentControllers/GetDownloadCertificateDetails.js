const StudentQueries = require("../../Queries/StudentQueries");
const { body, validationResult } = require("express-validator");
const ResponseCodes = require("../../helper/ResponseCodes");
const DepartmentQueries = require("../../Queries/DepartmentQueries");
const fs = require("fs");
const path = require("path");
const { generate } = require("../../helper/generateCertificate");
const mammoth = require("mammoth");
const officegen = require("officegen");
const DocxTemplater = require("docxtemplater");
const { log } = require("console");






const GetDownloadCertificateDetails = [
  async (req, res) => {
    try {
      const { requestId } = req.params;


      const filesFolderPath = path.join(
        __dirname,
        "../../uploads/certificateFormat/"
      );

      //   check validity of requestId
      const checkRequestId = await StudentQueries.checkRequestId(requestId);
      if (!checkRequestId) {
        return ResponseCodes.errorResponse(res, "Invalid Request Id");
      }

      const certificateRequest =
        await StudentQueries.getApprovedCertificateDetails(requestId);

      const certificateType = certificateRequest.certificatetype;
      const enrollment = certificateRequest.enrollment;
      console.log(enrollment, "enrollment");


      if (certificateRequest) {
        const certificate = await StudentQueries.getCertificateInfo(
          certificateType
        );

        // const getDocumentDetails = await DepartmentQueries.getDocumentLink(
        //   documentId
        // );

        const certificateDocumentVariables = certificate.CertificateVariables;
        const certificateVariables = certificateDocumentVariables.split(",");
        const variables = [...certificateVariables, "enrollment"];
        console.log(variables, "variables");

        // DONE TILL HERE!

        // if (getDocumentDetails) {
        //   const allfields = [...variables, enrollment];

        //   const getAllVariableData = await DepartmentQueries.getStudentData(
        //     enrollment
        //   );
        const studentInfo = await StudentQueries.getStudentProfileDetails(
          enrollment
        );

        console.log(studentInfo, "studentInfo");
        if (!studentInfo) {
          return ResponseCodes.errorResponse(
            res,
            "failed to get student information"
          );
        }

        const resultObject = variables.reduce((acc, key) => {
          if (studentInfo[0][0].hasOwnProperty(key)) {
            acc[key] = studentInfo[0][0][key];
          }

          return acc;
        }, {});
        console.log(resultObject, "resultObject");


        const externalData = resultObject;

        const filePromises = [];


        const pdfbuffer = await generate(
          certificate.certificateFormatPath,
          externalData,
          res
        );
        console.log(pdfbuffer);
        /*  res.set({
           "Content-Type": "application/octet-stream",
           "Content-Disposition": `attachment; filename="files.zip"`,
         }); */
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="certificate.pdf"');


        res.send(pdfbuffer);



        // if (fs.existsSync(filePath)) {
        //   filePromises.push(
        //     new Promise((resolve, reject) => {
        //       fs.readFile(filePath, (err, fileData) => {
        //         if (err) {
        //           reject(err);
        //         } else {
        //           resolve({ name: fileName, data: fileData });
        //         }
        //       });
        //     })
        //   );
        // }

        // Promise.all(filePromises)
        //   .then((filesData) => {
        //     res.set({
        //       "Content-Type": "application/octet-stream",
        //       "Content-Disposition": `attachment; filename="files.zip"`,
        //     });

        //     res.json({ filesData, externalData });
        //   })
        //   .catch((error) => {
        //     console.error("Error reading files:", error.message);
        //     return res.status(500).json({ error: "Error reading files." });
        //   });
      } else {
        return ResponseCodes.errorResponse(
          res,
          "Error in getting certificate details"
        );
      }
    } catch (error) {
      console.log(error.message);
      return ResponseCodes.errorResponse(
        res,
        "Error in getting certificate details"
      );
    }
  },
];

module.exports = GetDownloadCertificateDetails;
