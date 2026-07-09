require("dotenv").congig();
const path=require("path");
const express=require("express");
const app=express();
const cookieParser=require("cookie-parser");
const User=require("./models/user.js");
const PORT=process.env.PORT;
const {connectDB} =require("./connection.js");
const userRoute=require("./routes/user");
const { checkforAuthenticationCookie } = require("./middleware/authentication.js");
app.set("view engine","ejs");
app.set("views",path.resolve("./views"));


//connecting DB
connectDB(process.env.MONGODB_URL);

//Accepting form data
app.use(express.urlencoded({extended:false}));
app.use(cookieParser());
app.use(checkforAuthenticationCookie("token"))


app.get("/",(req,res)=>{
    res.render("home");
})


app.use("/user",userRoute);



app.listen(PORT,()=>{
    console.log(`Server started running at PORT:${PORT}`);
})