import UserModel from '../models/UserModel.js';
import HttpError from '../utils/httpError.js';




export const updateEducator = async(req, res, next)=>{
    
    try{
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm){
      return next(new HttpError('This route is not for password updates. Please use / update My Password.', 400));
    }

    //2)filtered out unwanted fields
    const filteredBody= filterObj(req.body, 'name', 'email');

    //3) update user document
    const updatedUser = await UserModel.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      data:{
        user: updatedUser
      }
    });
    

  }catch(err){
    return next(new HttpError(`Updating your details failed: ${err.message}`, 500));
  }
  };

