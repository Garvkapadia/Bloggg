require("dotenv").config();
const path=require("path");
const express=require("express");
const app=express();
const cookieParser=require("cookie-parser");
const Blog=require("./models/blog.js");
const User=require("./models/user.js");
const PORT=process.env.PORT;
const {connectDB} =require("./connection.js");
const userRoute=require("./routes/user");
const blogRoute=require("./routes/blog.js");
const { checkforAuthenticationCookie } = require("./middleware/authentication.js");
app.set("view engine","ejs");
app.set("views",path.resolve("./views"));


//connecting DB
connectDB(process.env.MONGODB_URL);

//Accepting form data
app.use(express.urlencoded({extended:false}));
app.use(cookieParser());
app.use(checkforAuthenticationCookie("token"))
app.use(express.static("./public"));
app.use((req,res,next)=>{
    res.locals.search="";
    next();
})

app.get("/",async(req,res)=>{
    let blogs=[];
    const search = req.query.search || "";
    const allBlogs=await Blog.find({}).sort({createdAt:-1});
    console.log(allBlogs);
    if(search){
        const blogs =await Blog.find({
    $or: [
        {
            title: {
                $regex: search,
                $options: "i"
            }
        },
        {
            content: {
                $regex: search,
                $options: "i"
            }
        }
    ]
}).sort({ createdAt: -1 });
    }
    
    res.render("home",{
        user:req.user,
        blogs:allBlogs,
        search,
    }
    );
})


app.use("/user",userRoute);


app.use("/blog",blogRoute);

app.get("/profile", async (req,res)=>{
    if(!req.user) return res.redirect("/user/signin");
    const userProfile = await User.findById(req.user._id).populate("savedBlogs");
    return res.render("profile",{
        user:req.user,
        savedBlogs: userProfile?.savedBlogs || []
    });
})

app.listen(PORT,()=>{
    console.log(`Server started running at PORT:${PORT}`);
})