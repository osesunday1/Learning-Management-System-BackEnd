const UserModel = require('../model/userModel');
const HttpError = require('../utils/httpError');

//function to filter object

const filterObj =(obj, ...allowedfields)=>{
  const newObject= {};
  Object.keys(obj).forEach(el=> {
    if(allowedfields.includes(el)) newObject[el] = obj[el]
  })
  return newObject;
}


// Controller function to retrieve all users
exports.getAllUsers = async (req, res, next) => {
    try {
      // Retrieve all guests from the database
      const users = await UserModel.find();
  
      // Send the response with the guests data
      res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (err) {
      // Pass the error to the error handling middleware
      return next(new HttpError(`Retrieving Users failed: ${err.message}`, 500));
    }
  };
