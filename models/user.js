const {createHmac,randomBytes,createHash}=require("node:crypto");
const mongoose=require("mongoose");
const { createTokenforUser } = require("../services/authentication.js");
const userSchema=new mongoose.Schema({
    fullName:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    salt:{
        type:String,
        
    },
    password:{
        type:String,
        required:true
    },
    profileImageURL:{
        type:String,
        default:"/images/default.png"
    },
    role:{
        type:String,
        enum:["USER","ADMIN"],
        default:"USER"
    },
    resetPasswordToken:{
        type:String,
    },
    resetPasswordExpires:{
        type:Date,
    },
    savedBlogs:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"blogs"
        }
    ]
},{timestamps:true});

userSchema.pre("save",async function(){
    const user=this;
    if(!user.isModified("password")) return ;

    const salt=randomBytes(16).toString();
    const hashedPassword=createHmac("sha256",salt)
    .update(user.password)
    .digest("hex");

    this.salt=salt;
    this.password=hashedPassword;
})

userSchema.methods.createPasswordResetToken=function(){
    const resetToken=randomBytes(32).toString("hex");
    const hashedToken=createHash("sha256").update(resetToken).digest("hex");

    this.resetPasswordToken=hashedToken;
    this.resetPasswordExpires=Date.now()+10*60*1000;
    return resetToken;
};

userSchema.methods.resetPassword=async function(newPassword){
    this.password=newPassword;
    this.resetPasswordToken=undefined;
    this.resetPasswordExpires=undefined;
    await this.save();
    return createTokenforUser(this);
};

userSchema.statics.findByPasswordResetToken=function(token){
    const hashedToken=createHash("sha256").update(token).digest("hex");
    return this.findOne({
        resetPasswordToken:hashedToken,
        resetPasswordExpires:{ $gt: Date.now() }
    });
};

userSchema.static("matchPasswordAndGenerateToken",async function(email,password){
    const user= await this.findOne({email});
    if(!user) throw new Error("User Not Found!");

    const salt=user.salt;
    const hashedPassword=user.password;
    const userProvidedHash=createHmac("sha256",salt)
    .update(password)
    .digest("hex")
    if(userProvidedHash!==hashedPassword) throw new Error("Incorrect Email or Password")
    
    const token=createTokenforUser(user);
    return token;
})

const user=mongoose.model("user",userSchema);

module.exports=user