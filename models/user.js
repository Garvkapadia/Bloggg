const {createHmac,randomBytes}=require("node:crypto");
const mongoose=require("mongoose");
const { createTokenforUser } = require("../services/authentication.js");
const userSchema=new mongoose.Schema({
    fullName:{
        type:String,
        required:true,
        unique:true
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
    }
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