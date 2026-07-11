const express=require("express");
//const User=require("../models/user.js");
const user = require("../models/user.js");
const {createTokenforUser}=require("../services/authentication.js");
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
 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return res.render("signup", {
            error: "Please enter a valid email address."
        });
    }
    const existingUser = await user.findOne({ email });

if (existingUser) {
    return res.render("signup", {
        error: "Email already exists."
    });
}
if (password.length < 8) {
    return res.render("signup", {
        error: "Password must be at least 8 characters."
    });
}
if (!fullName.trim()) {
    return res.render("signup", {
        error: "Name is required."
    });
}


 const usercreation=await user.create({
    fullName,
    email,
    password
 });
 console.log(usercreation);
 const token = createTokenforUser(usercreation);

 return res.cookie("token", token).redirect("/");
 
})


//logout
router.get("/logout",(req,res)=>{
    res.clearCookie("token").redirect("/");
})

module.exports=router;