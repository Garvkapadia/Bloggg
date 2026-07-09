 const {validateToken} =require("../services/authentication")
 function checkforAuthenticationCookie(cookieName){
    return (req,res,next)=>{
        const tokenCookieValue=req.cookies[cookieName];
        if(!tokenCookieValue){
            return next();
        }

        try{
            const userpayload=validateToken(tokenCookieValue);
            req.user=userpayload;
            console.log(req.user)
            res.locals.user = userpayload;
        }catch(err){
            console.log("no token");
        }
        next();
    };
 }

 module.exports={
    checkforAuthenticationCookie
 };