import express from 'express';
import { updateEducator } from '../controllers/educatorController.js'; 

const router = express.Router();



//update educator details
router.patch('/updateMe',updateEducator)

export default router;