 if(process.env.NODE_ENV!="production"){
     require("dotenv").config();
 }
 


const express=require("express");
const app=express();
const mongoose=require("mongoose");

const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const ExpressError=require("./utils/ExpressError.js");

const listing=require("./routes/listing.js");
const reviews=require("./routes/review.js");
const session=require("express-session");
const MongoStore = require('connect-mongo');

const flash=require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const User = require("./models/user.js");
const e = require("connect-flash");
const listingRouter=require("./routes/listing.js");
const reviewsRouter=require("./routes/review.js");
const userRouter=require("./routes/user.js");




const dbUrl=process.env.ATLASDB_URL;

main().then( () =>{
    console.log("connected to DB");
}).catch((err) => { 
    console.log(err);
});

async function main() {
    await mongoose.connect(dbUrl);
}







app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const store=MongoStore.create({
    
    mongoUrl:dbUrl,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter:24*3600,
  });

  store.on("error",()=>{
    console.log("Error i Mongo Session Store",err);
  })



const sessionOptions={
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        httpOnly:true, // Prevents client-side scripts from accessing the cookie
        expires:Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
        maxAge:1000 * 60 * 60 * 24 * 7 // 7 days
    }
};


//app.get("/",(req,res) => {
  //  res.send("Hi, I am root");
//});
  

    app.use(session(sessionOptions));
    app.use(flash());

// Passport.js configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware to make flash messages available in templates
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user; // Make current user available in templates
    
    next();
});

app.get("/", (req, res) => {
    res.redirect("/listings");
});

app.get("/demouser",async(req,res) => {
    let fakeUser = ({
        email:"abc@gmail.com",
        username: "Abhishek",
        
    });

    let registeredUser = await User.register(fakeUser, "HelloWorld");
    res.send(registeredUser);
});













app.use("/listings",listingRouter);
//Reviews
app.use("/listings/:id/reviews",reviewsRouter);
app.use("/",userRouter)

















// Error-handling middleware at the end
app.use((err, req, res, next) => {
  let {statusCode=500,message="Something went wrong!"} = err;
  res.status(statusCode).render("error.ejs",{message});
   // res.status(statusCode).send(message);
});




app.listen(8080, () =>{
    console.log("server is listening to port 8080");
});