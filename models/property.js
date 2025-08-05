const mongoose = require('mongoose');

const PropertySchema= mongoose.Schema(
  {
    imgUrl:{
      type:String,
      required:[true, "please add an image of the property"]
    },
    name:{
      type:String,
      required:[true, "Please enter the name"]
    },
    
    type:{
      type:String,
      required:[true, "please choose the type"]
    },

    line1:{
      type:String,
    },

    city:{
      type:String,
      required:[true, "please enter the city"]
    },

    state:{
      type:String,
    },

    year:{
      type: Number,
      required:[true, "please enter the date"]
    },
    
    description:{
      type:String,
      required:[true]
    },

    value:{
      type:Number,
      required:[true]
    },

    status:{
      type:String,
      required:[true]
    },

    area:{
      type:Number,
    },

    floors:{
      type:Number,
    },

    flats:{
      type:Number,
    },

    rooms:{
      type:Number,
    },

    valueRetrived:{
      type:Number,
    },
    rent :{
     type: Number,
    },
    userId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'User'
    }

    
  }
    
);

module.exports = mongoose.model('Property', PropertySchema);