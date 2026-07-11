const express=require("express");
const router=express.Router();
const Blog =require("../models/blog.js");
const Comment =require("../models/comment.js");
const User =require("../models/user.js");
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
    if(!req.user) return res.redirect("/signin");
    return res.render("addBlog",{
        user:req.user,

    });
})


// post your blog
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

// see myBlogs
router.get("/myBlogs",async (req,res)=>{
    const myBlog=await Blog.find({createdBy:req.user._id}).sort({createdAt:-1});
    return res.render("myBlogs",{
        user:req.user,
        blogs:myBlog,
    });
})




//editing blog
router.get("/edit/:id",async(req,res)=>{
 const blog=await Blog.findById(req.params.id);
 if(!blog) return res.status(404).send("Blog not found");
 if(blog.createdBy._id.toString()!==req.user._id.toString()){
    return res.status(403).send("Unauthorized");
 }
 return res.render("editBlog",{
    user:req.user,
    blog,
  })
});


//editing blog
router.post(
    "/edit/:id",
    upload.single("coverImage"),
    async (req, res) => {

        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).send("Blog not found");
        }

        // Authorization
        if (blog.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).send("Unauthorized");
        }

        blog.title = req.body.title;
        blog.content = req.body.content;
         if (req.file) {
            blog.coverImage = `/uploads/${req.file.filename}`;
        }
        await blog.save();
        return res.redirect(`/blog/${blog._id}`);
    });

//handle likes
router.post("/likes/:id",async(req,res)=>{
    const blog=await Blog.findById(req.params.id);
    if(!blog){
        return res.status(404).send("Blog not found");
    }
    const alreadyLiked=blog.likes.find((id)=> {
        return id.toString()===req.user._id.toString()
    });
    if(alreadyLiked){
        blog.likes.pull(req.user._id);
    }
    else{
        blog.likes.push(req.user._id);
    }

    await blog.save();
    return res.redirect(`/blog/${blog._id}`)
})

// handle saved blogs
router.post("/save/:id", async (req, res) => {
    if (!req.user) {
        return res.redirect("/signin");
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
        return res.status(404).send("Blog not found");
    }

    const userDoc = await User.findById(req.user._id);
    if (!userDoc) {
        return res.redirect("/signin");
    }

    const alreadySaved = userDoc.savedBlogs.some((savedBlogId) => savedBlogId.toString() === blog._id.toString());

    if (alreadySaved) {
        userDoc.savedBlogs.pull(blog._id);
    } else {
        userDoc.savedBlogs.push(blog._id);
    }

    await userDoc.save();
    return res.redirect(`/blog/${blog._id}`);
});

// finding blog
router.get("/:id",async(req,res)=>{
    const blog=await Blog.findById(req.params.id).populate("createdBy");
    const comments=await Comment.find({blogId:req.params.id}).populate("createdBy");
    const userDoc =  await User.findById(req.user._id);
    const alreadyLiked =  blog.likes.some(
        id => id.toString() === req.user._id.toString()
    ) ;
    const alreadySaved =  userDoc.savedBlogs.some(
        savedBlogId => savedBlogId.toString() === blog._id.toString()
    ) ;
    return res.render("blog",{
        user:req.user,
        blog,
        comments,
        alreadyLiked,
        alreadySaved,
    })
});

// posting comment
router.post("/comment/:blogId",async(req,res)=>{
    const comment=await Comment.create({
        content:req.body.content,
        blogId:req.params.blogId,
        createdBy:req.user._id
    });
    console.log(comment);
    return res.redirect(`/blog/${req.params.blogId}`)
})
module.exports=router;