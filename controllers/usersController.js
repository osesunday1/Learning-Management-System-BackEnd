import UserModel from '../models/UserModel.js';
import HttpError from '../utils/httpError.js';

/////======================function to filter object

const filterObj =(obj, ...allowedfields)=>{
  const newObject= {};
  Object.keys(obj).forEach(el=> {
    if(allowedfields.includes(el)) newObject[el] = obj[el]
  })
  return newObject;
}

// Controller function to retrieve all users
export const getAllUsers = async (req, res, next) => {
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

  export const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params; // Get user ID from route params

        // Ensure required fields are provided
        const { name, email, role } = req.body;

        // Update user
        const updatedUser = await UserModel.findByIdAndUpdate(id, { name, email, role }, { 
            new: true, 
            runValidators: true 
        });

        // Check if user exists
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "User updated successfully",
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({ message: `Error updating user: ${error.message}` });
    }
};



export const deleteUser = async(req, res, next)=>{
    try{
      const { id } = req.params; // Get user ID from route params

      await UserModel.findByIdAndDelete(id)

      res.status(200).json({
        status: 'success',
        data: null
      })
    }catch(err){
      return next(new HttpError(`Deleting User failed: ${err.message}`, 500));
    }
  }

  //get particular user
  export const getParticularUser = async (req, res, next) => {
    try {
  
        // 🔹 Get user ID from request params
        const { userId } = req.params;
  
        // 🔹 Find the user in the database
        const user = await User.findById(userId).select('-password'); // Exclude password
  
        // 🔹 If user not found, return 404
        if (!user) {
            return next(new HttpError('User not found', 404));
        }
  
        // 🔹 Send user data as response
        res.status(200).json({ success: true, user });
  
    } catch (error) {
        return next(new HttpError(`Could not retrieve user: ${error.message}`, 500));
    }
  };

  export const getLoginUser = async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, no user found" });
      }
  
      const data = await UserModel.findById(req.user.id).select("-password"); // ✅ Now `req.user.id` will be available
  
      if (!data) return res.status(404).json({ message: "User not found" });
  
      res.status(200).json({ data }); // ✅ Fixed `data` to `user`
    } catch (error) {
      return next(new HttpError(`Could not retrieve logged-in user: ${error.message}`, 500));
    }
  };