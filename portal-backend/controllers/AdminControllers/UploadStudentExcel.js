const { body, validationResult } = require("express-validator");
const ResponseCodes = require("../../helper/ResponseCodes");
const AdminQueries = require("../../Queries/AdminQueries");
const { sequelize } = require("../../helper/DbConnect");
const hash = require("../../helper/EncryptPassword");
const nodemailer = require("nodemailer");

const genderList = ["MALE", "FEMALE", "OTHER"];

const UploadStudentExcel = [
  body("semester")
    .notEmpty()
    .withMessage("Semester is required.")
    .isInt()
    .withMessage("Semester must be an Integer")
    .toInt()
    .isInt({ min: 1, max: 8 })
    .withMessage("Semester must be between 1 to 8"),

  body("branch")
    .notEmpty()
    .withMessage("Branch is required.")
    .isInt()
    .withMessage("Branch must be an Integer"),

  body("studentExcelData")
    .isArray()
    .withMessage("Student Data must be an Array"),

  body("studentExcelData.*.firstName")
    .notEmpty()
    .withMessage("First Name is required for each Student."),

  body("studentExcelData.*.lastName")
    .notEmpty()
    .withMessage("Last Name(Surname) is required for each Student."),

  body("studentExcelData.*.enrollment")
    .notEmpty()
    .withMessage("Enrollmet is required for each Student.")
    .isInt()
    .withMessage("Enrollment must be an Integer."),

  body("studentExcelData.*.email")
    .notEmpty()
    .withMessage("Email is required for each Student."),

  body("studentExcelData.*.gender")
    .notEmpty()
    .withMessage("Gender is required for each Student.")
    .custom((value) => {
      if (!genderList.includes(value)) {
        throw new Error(
          `Gender must be one of the specified values: ${genderList.join(
            ", "
          )}.`
        );
      }
      return true;
    }),

  async (req, res) => {
    if (req.user_info.role == "2") {
      if (req.user_info.departmentid != req.body.branch) {
        return ResponseCodes.unauthorizedResponse(
          res,
          "You are not Eligible to Upload Student Data."
        )
      }
    }
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      const { semester, branch, studentExcelData } = req.body;
      console.log(studentExcelData)
      // console.log(studentExcelData[].email)
      // let emails = studentExcelData.map((val)=>{
      //   return val.email;

      // })
      // console.log(emails)


      let password;
      let enrollment;
    let transaction;

      try {
        for (const obj of studentExcelData) {
          transaction = await sequelize.transaction();
          obj.username = obj.enrollment;
          // const password = uuidv4();
          password = Date.now();
          enrollment = obj.enrollment

          obj.password = hash(password.toString());
          obj.semester = semester;
          obj.branch = branch;
          obj.role = "3";
          obj.AllowUpdate = true;
          console.log(obj.enrollment)
            
          //not running from here 
          //error while loading more emials
          await AdminQueries.UploadStudentExcel(obj, transaction);
          //change 
          const a = await transaction.commit();

          if (a === undefined) {
            console.log(password)
            console.log(enrollment)

          }
          else {

            console.log("running else")
            await transaction.rollback();
            return ResponseCodes.errorResponse(
              res,
              "Error Encountered while Saving the Data."
            );
          }


          //mail start here 

          async function main() {
            // Async function enables allows handling of promises with await

            // First, define send settings by creating a new transporter: 
            let transporter = nodemailer.createTransport({
              host: "smtp.gmail.com", // SMTP server address (usually mail.your-domain.com)
              port: 465, // Port for SMTP (usually 465)
              secure: true, // Usually true if connecting to port 465
              auth: {
                user: "techtechnology12@gmail.com", // Your email address
                pass: "vzai dizd gixc romx", // Password (for gmail, your app password)
                // ⚠️ For better security, use environment variables set on the server for these values when deploying
              },
            });
            const reciver = ["techtechnology12@gmail.com", "pateldeep1162004@gmail.com", "dhruvisha14299@gmail.com"]
            // Define and send message inside transporter.sendEmail() and await info about send from promise:
            let info = await transporter.sendMail({
              from: '"LDCE ADMIN" <pateldeep1162004@gmail.com>',
              to: obj.email,
              subject: "LDCE STUDENTPORTAL",
              html: `
      <h1>LDCE Portal Credentials</h1>
      <p>Userid :${enrollment}</p>
      <p>Password: ${password}</p>
      `,
            });

            console.log(info.messageId); // Random ID generated after successful send (optional)
          }

            await main()
            .catch(err => console.log(err));

          //mail end here
        }

        return ResponseCodes.successResponse(res, "data saved successfully ");
      }

      //change doen


      catch (error) {

        console.log("in catch")
        await transaction.rollback();
        return ResponseCodes.errorResponse(
          res,
          error.hasOwnProperty('errors')
            ? error.errors[0].message + " (error caught for " + error.errors[0].value + " , path: " + error.errors[0].path + " )"
            : error.message
        )
      }
    } else {
      return ResponseCodes.validationErrorWithData(
        res,
        errors.errors[0].msg,
        errors.errors[0]
      );
    }
  },
];

module.exports = UploadStudentExcel;