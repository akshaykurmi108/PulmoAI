const express = require('express');
const app = express();
const cors= require("cors");
const multer = require("multer");
const upload = multer({ dest: "public/uploads/" });
const path = require("path");
const { spawn } = require("child_process");
const ExpressError= require("./ExpressError");


//image provider
// const pool=require('./database');
const { User, Patient } = require("./model/user");
const methodOverride=require("method-override");


const cookieParser = require('cookie-parser');

const bcrypt = require('bcrypt'); 
const jwt=require('jsonwebtoken');
// const user = require('./model/user');
const { error } = require('console');
const { resolve } = require('path/win32');

let port =3000;
app.set("view engine","ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(methodOverride("_method"));



// pool.query("SELECT 1", (err, result) => {
//   if (err) {
//     console.error("DB connection failed:", err);
//   } else {
//     console.log("DB connected successfully:", result);
//   }
// });

app.get("/contact",(req,res)=>{
  res.render("contact.ejs");

})
app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;

  const sql = "INSERT INTO contact (name, email, message) VALUES (?, ?, ?)";

  pool.query(sql, [name, email, message], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database insert failed" });
    }
    res.json({ status: "success", id: result.insertId });
  });
});



//authorization 
app.get("/signup",(req,res)=>{
res.render("signup");
  
})



app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).send("All fields are required");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("Email already registered");
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Save new user
    const newUser = await User.create({
      username,
      email,
      password: hash
    });
    console.log("New user saved:", newUser);

    // Generate token
    const token = jwt.sign({ email }, "shh");
    res.cookie("token", token);

    // Redirect/render profile page
    // After saving new user and setting cookie
res.redirect("/doctorprofile");

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).send("Error signing up");
  }

  const { username, email, password, confirmPassword } = req.body;
if (password !== confirmPassword) {
  return res.status(400).send("Passwords do not match");
}
});



app.get("/login",(req,res)=>{
  res.render("login");
})

app.post("/login", async function(req, res) {
  let user = await User.findOne({ email: req.body.email });
  if (!user) return res.send("Invalid email or password");

  bcrypt.compare(req.body.password, user.password, function(err, result) {
    if (result) {
      let token = jwt.sign({ email: user.email }, "shh");
      res.cookie("token", token);

      

      // Render a dynamic profile page for this user
       res.redirect("/doctorprofile");
    } else {
      res.send("Invalid email or password");
    }
  });
});


app.get("/logout",(req,res)=>{
  res.cookie("token","");
  res.redirect("/");
});


// async function getAllUsers() {
//     const users = await userModel.find();
//     console.log(users);
    
//   }
//   getAllUsers();


//edit profile
app.get("/doctorProfile/:id/edit",async (req,res)=>{
  
  let {id}=req.params;
  const user =await User.findById(id);
  res.render("edit.ejs",{user});
  
})
//update edit
app.put("/doctorProfile/:id", async (req,res)=>{
  let {id} = req.params;
  let{email:newemail}=req.body;
 const updatedUser = await User.findByIdAndUpdate(
  id,
  { email: newemail },
  { runValidators: true, returnDocument: "after" }
);

 const token = jwt.sign({ email: updatedUser.email }, "shh");
  res.cookie("token", token);

  console.log(updatedUser);
  res.redirect("/doctorProfile");

})

//index route 
app.get("/doctorprofile", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.redirect("/login"); // or handle missing token gracefully
    }

    const decoded = jwt.verify(token, "shh");
    const doctor = await User.findOne({ email: decoded.email });

    if (!doctor) {
      return res.status(404).send("User not found");
    }
    const patients=await Patient.find({doctor:doctor._id
    });
    const totalPatients = await Patient.countDocuments({doctor:doctor._id});

    res.render("userPage", { user:doctor,patients,totalPatients });
  } catch (err) {
    console.error("Error loading doctor profile:", err);
    res.status(500).send("Error loading profile");
  }

  
});
//----------
app.get("/home",(req,res)=>{
  res.render("home.ejs");
});


app.get("/addPatient",async(req,res)=>{
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.redirect("/login"); // or handle missing token gracefully
    }
  }catch(err){
    res.status(400).send("page not found")
  }
  res.render("add-patient.ejs");
});


// Example: create a new patient
app.post("/addPatient", async (req, res) => {
  try {
    const token = req.cookies.token;
    let doctorId = null;

    if (token) {
      const decoded = jwt.verify(token, "shh");
      const doctor = await User.findOne({ email: decoded.email });
      if (doctor) doctorId = doctor._id;
    }

    // Calculate age from dob
    const dob = new Date(req.body.dob);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    const patient = new Patient({
      name: req.body.name,
      dob: dob,
      age: age,              // ✅ store age
      gender: req.body.gender,
      diagnosis: req.body.diagnosis,
      doctor: doctorId
    });

    await patient.save();
    res.redirect("/patientlist");
  } catch (err) {
    console.error("Error adding patient:", err);
    res.status(500).send("Error adding patient");
  }
});




app.get("/patientlist", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");

    const decoded = jwt.verify(token, "shh");
    const doctor = await User.findOne({ email: decoded.email });
    if (!doctor) return res.status(404).send("Doctor not found");

    // Only fetch patients belonging to this doctor
    const patients = await Patient.find({ doctor: doctor._id });
    console.log("fetching to doctor",doctor )

    res.render("patientlist.ejs", { patients });
  } catch (err) {
    console.error("Error loading patient list:", err);
    res.status(500).send("Error loading patient list");
  }
});

app.delete("/patientlist/:id", async(req,res)=>{
  
let {id}=req.params;
const deletedPatient=await Patient.findByIdAndDelete(id);
res.redirect("/doctorprofile");
console.log(deletedPatient);

})
app.get("/about",(req,res)=>{
  res.render("about.ejs");
});


app.get("/settings",(req,res)=>{
  res.render("settings.ejs");
})

app.get("/patient",(req,res)=>{
  res.render("patient.ejs");
})

app.get("/scan", (req, res) => {
  res.render("scan.ejs", { result: null });
});



app.post("/predict", upload.single("file"), (req, res) => {

  try {

    if (!req.file) {

      return res.status(400).json({
        status: "No File Uploaded"
      });

    }

    const filePath = req.file.path;

    console.log("Uploaded File:", filePath);

    // Correct Python File
    const pythonFile = path.join(__dirname, "../AI/model/predict.py");

    console.log("Python File:", pythonFile);

  console.log("Python File:", pythonFile);

console.log(
  "Using Python:",
  "C:/Users/Anish/AppData/Local/Programs/Python/Python313/python.exe"
);

const py = spawn(
  "C:/Users/Anish/AppData/Local/Programs/Python/Python313/python.exe",
  [pythonFile, filePath]
);
    let data = "";

    // Python Output
    py.stdout.on("data", (chunk) => {

      data += chunk.toString();

    });

    // Python Errors
    py.stderr.on("data", (err) => {

      console.error("Python STDERR:", err.toString());

    });

    // Python Finished
    py.on("close", (code) => {

      console.log("Raw Python Output:", data);

      try {

        const cleanData = data.trim();

const result = JSON.parse(cleanData);

        res.json(result);

      } catch (err) {

        console.log("JSON Parse Error:", err);

        res.status(500).json({
          status: "Prediction Failed",
          rawOutput: data
        });

      }

    });
    

  } catch (err) {

    console.log(err);

    res.status(500).json({
      status: "Server Error"
    });

  }

});

app.use((err,req,res,next)=>{
  let{status=500,message="something went wrong!!"}=err;

  res.status(status).send(message)
});

 app.listen(port,()=>{
     console.log(`listening on port 3000`);
})