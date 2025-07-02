const Listing=require("../models/listing");
const User=require("../models/user.js");

module.exports.renderSignupForm=(req, res) => {
    res.render('signup.ejs');
};

module.exports.signUp=async (req, res, next) => {
    try{
         let { username, email, password } = req.body;
    const newUser = new User({ username, email });
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
    // Automatically log in the user after registration
    req.login(registeredUser, (err) => {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Welcome to Wonderlust!');
    res.redirect('/listings');
    });
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/signup');
    }
};

module.exports.renderLoginForm=(req, res) => {
    res.render('login.ejs');
};
   
module.exports.login=async(req, res) => {
    req.flash('success', 'Welcome to Wonderlust!');
    let redirectUrl = res.locals.redirectUrl || '/listings';
    res.redirect(redirectUrl);
};

module.exports.logout=(req, res,next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash('success', 'You are logged out!');
        res.redirect('/listings');
    });
};