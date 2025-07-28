const mongoose = require('mongoose');

const UserSchema= mongoose.Schema(
  {
    name:{
      type:String,
      required:[true, "please enter user name"]

    },

    email:{
      type:String,
      required:[true, "please enter email"]
    },

    phoneNo:{
      type:String,
      required:[true, "please enter phone no"]
    },

    password:{
      type:String,
      required:[true, "please enter password"]
    },

    profileImage:{
      type:String,
    },
    
    properties:[
      {
        type:mongoose.Schema.Types.ObjectId,
        ref:'Property'
      }
    ]
  }
);

module.exports = mongoose.model('User', UserSchema);