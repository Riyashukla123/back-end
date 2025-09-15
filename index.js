const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const User = require('./models/user.js');
const Property = require('./models/property.js');
const cors = require('cors');
const app = express();
require('dotenv').config();
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());



app.post('/signup_user', async (req,res) => {
  try{
    const email= req.body.email;
    const already_exist = await User.findOne({email});
    if(already_exist) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    const user = await User.create(req.body);
    res.status(200).json({ success: true, message: 'User created successfully' });
  } catch(error){
    res.status(500).json({message:error.message});
  }
});

app.post('/login_user', async (req,res)=>{
  try{
    const {email,password} = req.body;
    const existingUser = await User.findOne({email});
    if(existingUser.password == password) {
  const userObj = existingUser.toObject();
  if (userObj.profileImage) {
    userObj.profileImage = `http://localhost:5000/${userObj._id}/image?timestamp=${Date.now()}`;
  }
  return res.status(200).json(userObj);
}

   if(existingUser.password == password) {
    return res.status(200).json(existingUser);
   }
   res.status(404).send('wrong password');
   

  }catch(error){
    res.status(500).json({message:error.message});
  }
})

app.put('/update_user/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid ObjectId");
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const{_id, password}= await User.findById(id);
    if (!_id) {
      console.log("User not found for update");
      return res.status(404).json({ message: "User not found" });
    }
    if(req.body.curr_password && password !== req.body.curr_password){
      return res.status(401).json({error:true, message: "password is not matched"})
    }
    const updatedUser ={
      name:req.body.name,
      email: req.body.email,
      phoneNo: req.body.phoneNo,
      password: req.body.new_password || password
    }
    const user = await User.findByIdAndUpdate(id, updatedUser);
    if(user)
      
    res.status(200).json({message: "Profile is successfully updated"});


  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: error.message });
  }
});

//add user profile image
const upload = multer({ dest: 'uploads/' });

app.put('/:id/upload-image', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const imgPath = path.join('uploads', `${id}.jpg`);
    fs.renameSync(req.file.path, imgPath);

    user.profileImage = imgPath;
    await user.save();

    res.status(200).json({ message: "Image uploaded" });
  } catch (err) {
    console.error("Image upload error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get('/:id/image', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user || !user.profileImage) {
      return res.status(404).send("Image not found");
    }

    const imgPath = path.resolve(user.profileImage);
    res.sendFile(imgPath);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

app.delete('/:id/delete-image', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user || !user.profileImage) {
      return res.status(404).json({ message: "Image not found" });
    }

    fs.unlinkSync(path.resolve(user.profileImage));
    user.profileImage = "";
    await user.save();

    res.status(200).json({ message: "Image deleted successfully" });
  } catch (err) {
    console.error("Delete image error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
///OVERVIEW

app.get('/:id/overview', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid ObjectId");
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id);
    if (!user) {
      console.log("User not found for overview");
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch all property documents using the array of IDs
    const properties = await Property.find({ _id: { $in: user.properties } });

    // Construct overview data and total value
    let totalValue = 0;
    const propertyOverview = properties.map((prop) => {
      totalValue += prop.value || 0;
      return [prop.name, prop.value, prop.type];
    });

    // Send the response
    res.status(200).json({
      success: true,
      totalValue,
      propertyOverview
    });

  } catch (error) {
    console.error("Error in /:id/overview:", error);
    res.status(500).json({ message: "Server error" });
  }
});

///properties api
app.use('/property_uploads', express.static(path.join(__dirname, 'property_uploads')));

const propertyUpload = multer({ dest: 'property_uploads/' });

app.get('/:id/user_property', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid ObjectId");
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id);
    if (!user) {
      console.log("User not found for adding property");
      return res.status(404).json({ message: "User not found" });
    }

    const userProps = user.properties;

    const Props = await Promise.all(
      userProps.map(async (propId) => {
        const prop = await Property.findById(propId);
        if (!prop) return null;

        const propObj = prop.toObject();

        if (propObj.imgUrl) {
          propObj.imgUrl = `${req.protocol}://${req.get('host')}/${propObj.imgUrl}`;
        }

        return propObj;
      })
    );

    const validProps = Props.filter(p => p !== null);

    res.status(200).json({
      success: true,
      message: 'Properties retrieved successfully',
      data: validProps
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/:id/add_property', propertyUpload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const imagePath = `property_uploads/${file.filename}`;
    const fullImgUrl = `${req.protocol}://${req.get('host')}/${imagePath}`;

    const propertyData = {
      ...req.body,
      userId: id,
      imgUrl: imagePath
    };

    const prop = await Property.create(propertyData);
    user.properties.push(prop._id);
    await user.save();

    res.status(200).json({ success:true,
      message: "Property added successfully", imgUrl: fullImgUrl, 
    property: { ...prop.toObject(), imgUrl: fullImgUrl }});

  } catch (error) {
    console.error("Add property error:", error);
    res.status(500).json({ message: error.message });
  }
});

app.put('/:id/:propertyId/update_prop', propertyUpload.single('image'), async (req, res) => {
  try {
    const { id, propertyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ message: "Invalid ID(s)" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    Object.assign(property, req.body);

    if (req.file) {
      const imagePath = `property_uploads/${req.file.filename}`;
      property.imgUrl = imagePath;
    }

    await property.save();

   const fullImgUrl = property.imgUrl?.startsWith("http")
  ? property.imgUrl
  : `${req.protocol}://${req.get('host')}/${property.imgUrl}`;

res.status(200).json({
  success: true,
  message: "Property updated successfully",
  data: {
    ...property.toObject(),
    imgUrl: fullImgUrl
  }
});


  } catch (err) {
    console.error("Edit property error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete('/:user_id/:prop_id/delete_prop', async (req, res) => {
  try {
    const { user_id, prop_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(prop_id)) {
      return res.status(400).json({ message: "Invalid property ID" });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const ownsProperty = user.properties.some(p => p.equals(prop_id));
    if (!ownsProperty) {
      return res.status(403).json({ message: "User does not own this property" });
    }

    const property = await Property.findById(prop_id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (property.imgUrl) {
      const imagePath = path.join(__dirname, property.imgUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, (err) => {
          if (err) console.warn('Error deleting image:', imagePath);
        });
      }
    }

    await Property.findByIdAndDelete(prop_id);
    user.properties = user.properties.filter(p => !p.equals(prop_id));
    await user.save();

    res.status(200).json({
      success: true,
      message: "Property and image deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting property:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.get("/", (req, res) => {
  res.send("API is running...");
});

mongoose.connect(process.env.MONGO_URI).then(()=>{
  console.log("connected to database");
  app.listen(process.env.PORT || 80, '0.0.0.0', ()=>{
  console.log('server is running on port 5000');
});

}).catch((err)=>{
console.log("connection is failed", err);

})
