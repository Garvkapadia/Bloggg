const JWT=require("jsonwebtoken");

const secret=process.env.JWT_SECRET;

//creating token
function createTokenforUser(user){
    const payload={
        _id:user._id,
        fullName:user.fullName,
        email:user.email,
        profileImageURL:user.profileImageURL,
        role:user.role
    }
    const token=JWT.sign(payload,secret);
    return token;
}

//checking token
function validateToken(token){
const payload=JWT.verify(token,secret);
return payload;
}




module.exports={createTokenforUser,validateToken};