//require('dotenv').config({path:"./env"});
import { application } from 'express'
import connectDB from './db/index.js'
import {app} from './app.js'
import dotenv from "dotenv"

dotenv.config({
    path:"./.env"
})


connectDB()
.then(()=>{
    const PORT = process.env.PORT || 8002; // Changed default port to 8002
    app.listen(PORT);
    console.log(`Server is running at port ${PORT}`);
})
.catch((error)=>{
    console.log("MONGODB connection failed!!!!", error);
    
})













/*

import express from "express";
const app=express();
(async ()=>{
    try{
        mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        app.on("error",(error)=>{
            console.log("Error: ",error);
            throw error;
        });

        app.listen(process.env.PORT,()=>{
            console.log(`app is listening on port ${process.env.PORT}`);
        })
    }
    catch(error){
        console.error("ERROR: ",error);
        throw error;
    }

})()

*/