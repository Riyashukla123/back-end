const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/user.js');
const Property = require('./models/property.js');
const cors = require('cors');
const app = express();
app.use(cors());

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
    if(!existingUser) {
      return res.status(404).send("email doesn't exist");
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

app.get('/:id/user_property', async (req,res)=>{
  try{
      const {id}= req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid ObjectId");
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const user= await User.findById(id);
    if (!user) {
      console.log("User not found for adding property");
      return res.status(404).json({ message: "User not found" });
    }
    const userProps= user.properties;
    const Props = await Promise.all(
      userProps.map(async (propId) => {
        const prop = await Property.findById(propId);
        return prop ? prop.toObject() : null; 
      })
    );
    const validProps = Props.filter(p => p !== null);
    res.status(200).json({ success: true, message: 'Properties retrived successfully',data:validProps  });
  }catch(error){
    res.status(500).json({message:error.message});
  }
})
app.post('/:id/add_property', async (req,res) => {
  try{
    const {id}= req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid ObjectId");
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const user= await User.findById(id);
    if (!user) {
      console.log("User not found for adding property");
      return res.status(404).json({ message: "User not found" });
    }
    const property = await  Property.create({...req.body, userId: id});
    user.properties.push(property._id);
    await user.save();
    res.status(200).json({ success: true, message: 'Property added successfully', property });

  } catch(error){
    res.status(500).json({message:error.message});
  }
});

app.put('/:user_id/:prop_id/update_prop', async (req, res) => {
  try {
    const { user_id, prop_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      console.log("Invalid user ID");
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(prop_id)) {
      console.log("Invalid property ID");
      return res.status(400).json({ message: "Invalid property ID" });
    }

    const user = await User.findById(user_id);
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    const ownsProperty = user.properties.some(p => p.equals(prop_id));
    if (!ownsProperty) {
      console.log("User does not own this property");
      return res.status(403).json({ message: "User does not own this property" });
    }

    const property = await Property.findById(prop_id);
    if (!property) {
      console.log("Property not found");
      return res.status(404).json({ message: "Property not found" });
    }

    const updated_prop = await Property.findByIdAndUpdate(prop_id, req.body, { new: true });
    res.status(200).json({ success: true, message: "Property updated successfully", data: updated_prop });

  } catch (error) {
    console.error("Error updating property:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete('/:user_id/:prop_id/delete_prop', async (req, res) => {
  try {
    const { user_id, prop_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      console.log("Invalid user ID");
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(prop_id)) {
      console.log("Invalid property ID");
      return res.status(400).json({ message: "Invalid property ID" });
    }

    const user = await User.findById(user_id);
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    const ownsProperty = user.properties.some(p => p.equals(prop_id));
    if (!ownsProperty) {
      console.log("User does not own this property");
      return res.status(403).json({ message: "User does not own this property" });
    }

    const property = await Property.findById(prop_id);
    if (!property) {
      console.log("Property not found");
      return res.status(404).json({ message: "Property not found" });
    }


    await Property.findByIdAndDelete(prop_id);

  
    user.properties = user.properties.filter(p => !p.equals(prop_id));
    await user.save();

    
    const updatedUser = await User.findById(user_id).populate('properties');

    res.status(200).json({
      success: true,
      message: "Property deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting property:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.get("/", (req, res) => {
  res.send("API is running...");
});

mongoose.connect("mongodb+srv://riya70077:Mute123@backenddb.3tsx9c9.mongodb.net/?retryWrites=true&w=majority&appName=BackendDB").then(()=>{
  console.log("connected to database");
  app.listen(5000, ()=>{
  console.log('server is running on port 5000');
});

}).catch((err)=>{
console.log("connection failed", err);

})
