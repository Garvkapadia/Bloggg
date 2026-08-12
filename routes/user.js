const express=require("express");
const User=require("../models/user.js");
const {createTokenforUser}=require("../services/authentication.js");
const { sendPasswordResetEmail } = require("../services/email.js");
const router=express.Router();

router.get("/signin",(req,res)=>{
    if(req.user) return res.redirect("/");
    return res.render("signin",{
        error:null
    });
});

router.get("/signup",(req,res)=>{
    return res.render("signup",{ error:null });
});

router.get("/forgot",(req,res)=>{
    return res.render("forgotPassword",{
        error:null,
        message:null
    });
});

router.get("/reset/:token",async(req,res)=>{
    const foundUser=await User.findByPasswordResetToken(req.params.token);
    if(!foundUser){
        return res.render("forgotPassword",{
            error:"Password reset token is invalid or has expired.",
            message:null
        });
    }

    return res.render("resetPassword",{
        error:null,
        token:req.params.token
    });
});

//signin
router.post("/signin",async(req,res)=>{
   try{
     const {email,password}=req.body;
     const token= await User.matchPasswordAndGenerateToken(email,password);
     return res.cookie("token",token).redirect("/");
   }catch(err){
        return res.status(401).render("signin", {
            error:err.message,
        });
   }
});

//signup
router.post("/signup",async(req,res)=>{
    const {fullName,email,password}=req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return res.render("signup", {
            error: "Please enter a valid email address."
        });
    }

    const existingUser = await User.findOne({ email });
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

    const usercreation=await User.create({
        fullName,
        email,
        password
    });
    const token = createTokenforUser(usercreation);
    return res.cookie("token", token).redirect("/");
});

router.post("/forgot",async(req,res)=>{
    try{
        const {email}=req.body;
        const existingUser = await User.findOne({ email });
        if(!existingUser){
            return res.render("forgotPassword",{
                message:"If that email is registered, a password reset link has been sent.",
                error:null
            });
        }

        const resetToken=existingUser.createPasswordResetToken();
        await existingUser.save({validateBeforeSave:false});

        const resetUrl = `${req.protocol}://${req.get("host")}/user/reset/${resetToken}`;
        await sendPasswordResetEmail({
            email: existingUser.email,
            name: existingUser.fullName,
            resetUrl
        });

        return res.render("forgotPassword",{
            message:"If that email is registered, a password reset link has been sent.",
            error:null
        });
    }catch(err){
        console.error(err);
        return res.status(500).render("forgotPassword",{
            error:"Unable to send password reset email. Please try again later.",
            message:null
        });
    }
});

router.post("/reset/:token",async(req,res)=>{
    try{
        const {password, confirmPassword}=req.body;
        if(password.length < 8){
            return res.render("resetPassword",{
                error:"Password must be at least 8 characters.",
                token:req.params.token
            });
        }
        if(password !== confirmPassword){
            return res.render("resetPassword",{
                error:"Passwords do not match.",
                token:req.params.token
            });
        }

        const foundUser=await User.findByPasswordResetToken(req.params.token);
        if(!foundUser){
            return res.render("forgotPassword",{
                error:"Password reset token is invalid or has expired.",
                message:null
            });
        }

        const token = await foundUser.resetPassword(password);
        return res.cookie("token",token).redirect("/");
    }catch(err){
        console.error(err);
        return res.status(500).render("resetPassword",{
            error:"Unable to reset password. Please try again.",
            token:req.params.token
        });
    }
});

//logout
router.get("/logout",(req,res)=>{
    res.clearCookie("token").redirect("/");
});

module.exports=router;