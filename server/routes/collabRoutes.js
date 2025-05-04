import express from "express";
import  {getCollab}  from "../controllers/collabControllers.js";
 const router = express.Router();


router.get("/",getCollab)


export default router

