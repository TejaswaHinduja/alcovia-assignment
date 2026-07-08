import express , { Router }from "express"


const studentRoutes=Router()

studentRoutes.get("/students/:id",async(req,res)=>{
    const sId=req.query.id;

})

studentRoutes.get("/students/:id/sessions",async(req,res)=>{

})