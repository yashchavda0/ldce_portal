const AdminQueries = require("../../Queries/AdminQueries");
const ResponseCodes = require("../../helper/ResponseCodes");

const GetAllDynamicCategory = [
    async(req, res) => {
        try {
            const category = await AdminQueries.GetAllDynamicCategory();
            return ResponseCodes.successResponseWithData(res, "Categories Fetched Successfully", category);
        } catch (error) {
            console.log(error);
            return ResponseCodes.errorResponse(res,
                error.hasOwnProperty('errors') 
                    ? error.errors[0].message
                    : error.message
            );
        }
    }
];

module.exports = GetAllDynamicCategory;