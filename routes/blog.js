const express=require("express");
const router=express.Router();
const Blog =require("../models/blog.js");
const Comment =require("../models/comment.js");
const multer=require("multer");
const path=require("path");
const storage=multer.diskStorage({
    destination:function(req,file,cb){
       return cb(null,path.resolve("./public/uploads"));
    },
    filename:function(req,file,cb){
        const fileName=`${Date.now()}-${file.originalname}`;
        return cb(null,fileName);
    }
})

const upload=multer({storage:storage});

router.get("/add-new",(req,res)=>{
    return res.render("addBlog",{
        user:req.user,

    });
})

router.post("/",upload.single("coverImage"),async (req,res)=>{
    console.log(req.body);
    console.log(req.file);

    const {title,content}=req.body;
   const blog=await Blog.create({
        title,
        content,
        createdBy:req.user._id,
        coverImage:`/uploads/${req.file.filename}`
    })
    console.log(blog);
    return res.redirect(`/blog/${blog._id}`);
})


router.get("/:id",async(req,res)=>{
    const blog=await Blog.findById(req.params.id).populate("createdBy");
    return res.render("blog",{
        user:req.user,
        blog,
    })
});


router.post("/comment/:blogId",async(req,res)=>{
    const comment=await Comment.create({
        content:req.body.content,
        blogId:req.params.blogId,
        createdBy:req.user._id
    });
    return res.redirect(`/blog/${req.params.blogId}`)
})
module.exports=router;