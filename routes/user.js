const express=require("express");
//const User=require("../models/user.js");
const user = require("../models/user.js");
const router=express.Router();

router.get("/signin",(req,res)=>{
    if(req.user) return res.redirect("/");
    return res.render("signin",{
        error:null
    });
})
router.get("/signup",(req,res)=>{
    return res.render("signup");
})

//signin
router.post("/signin",async(req,res)=>{
   try{
     const {email,password}=req.body;
     const token= await user.matchPasswordAndGenerateToken(email,password)
     //if(req.user) return res.redirect("/");
     return res.cookie("token",token).redirect("/");
   }catch(err){
        return res.status(401).render("signin", {
            error:err.message,
        });
   }
})


//signup
router.post("/signup",async(req,res)=>{
    console.log(req.body);
 const {fullName,email,password}=req.body;
 const usercreation=await user.create({
    fullName,
    email,
    password
 });
 console.log(usercreation);
 return res.redirect("/");
})


//logout
router.get("/logout",(req,res)=>{
    res.clearCookie("token").redirect("/");
})

module.exports=router;