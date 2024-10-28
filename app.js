// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const session = require('express-session');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const ejs = require("ejs");
const path = require("path");
const app = express();
const port = process.env.PORT || 4000;
const flash = require('connect-flash');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(cookieParser());
app.use(session({
    secret: 'lectureappsecret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set `secure: true` if using HTTPS
}));

app.use(flash()); // Add this line

// Pass flash messages to all views
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URL)
    .then(() => console.log('MongoDB connected!'))
    .catch(err => console.log(err));

// MongoDB Schemas & Models
const UserSchema = new mongoose.Schema({
    name: String,
    regnumber: String,
    department: String,
    email: String,
    phone: String,
    userType: String // 'student' or 'instructor'
});

const LectureSchema = new mongoose.Schema({
    courseTitle: String,
    venue: String,
    instructorName: String,
    courseCode: String,
    time: Date
});

const User = mongoose.model('User', UserSchema);
const Lecture = mongoose.model('Lecture', LectureSchema);

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { name, regnumber, department, email, phone } = req.body;
    const userType = req.body.userType || 'student'; // defaulting to 'student' if not provided

    const newUser = new User({ name, regnumber, department, email, phone, userType });
    try {
        await newUser.save();
        req.flash('success_msg', 'Registration successful! You can now log in.');
        res.redirect('/login-student');
    } catch (error) {
        req.flash('error_msg', 'Error during registration. Please try again.');
        res.status(500).send("Error during registration");
    }
});

// Student Login Page
app.get('/login-student', (req, res) => {
    res.render('loginStudent');
});

// Instructor Login Page
app.get('/login-instructor', (req, res) => {
    res.render('loginInstructor');
});

app.post('/login-student', async (req, res) => {
    const { name, email } = req.body;
    const user = await User.findOne({ name, email, userType: 'student' });

    if (user) {
        req.session.user = user;
        req.flash('success_msg', 'Login successful! Welcome to your dashboard.');
        res.redirect('/student-dashboard');
    } else {
        req.flash('error_msg', 'Invalid credentials, please try again.');
        res.redirect('/login-student');
    }
});


// Handle Instructor Login
app.post('/login-instructor', (req, res) => {
    const { password } = req.body;
    const instructorPassword = "Mouau";

    if (password === instructorPassword) {
        // Create an instructor session flag
        req.session.isInstructor = true;
        res.redirect('/instructor-dashboard');
    } else {
        res.redirect('/login-instructor');
    }
});

// Protect instructor dashboard
app.get('/instructor-dashboard', (req, res) => {
    if (req.session.isInstructor) {
        res.render('instructorDashboard');
    } else {
        res.redirect('/login-instructor');
    }
});


// Student dashboard route
app.get('/student-dashboard', async (req, res) => {
    if (req.session.user && req.session.user.userType === 'student') {
        const lectures = await Lecture.find();
        res.render('studentDashboard', { student: req.session.user, lectures });
    } else {
        res.redirect('/login-student');
    }
});


app.post('/instructor-dashboard', async (req, res) => {
    const { courseTitle, venue, instructorName, courseCode, time } = req.body;
    try {
        const newLecture = new Lecture({ courseTitle, venue, instructorName, courseCode, time });
        await newLecture.save();

        // Notify students
        const students = await User.find({ userType: 'student' });
        students.forEach(student => {
            sendNotification(student.email, courseTitle, venue, time);
        });

        // Set success flash message
        req.flash('success_msg', 'Lecture scheduled successfully and notifications sent to students!');
    } catch (error) {
        console.error("Error scheduling lecture:", error);
        // Set error flash message
        req.flash('error_msg', 'An error occurred while scheduling the lecture. Please try again.');
    }

    res.redirect('/instructor-dashboard');
});



// Helper function to send email notifications
function sendNotification(email, courseTitle, venue, time) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "lovelynikwuka2001@gmail.com",
            pass: "btjx jrdu bbqb zpto"
        }
    });

    const mailOptions = {
        from: "lovelynikwuka2001@gmail.com",
        to: email,
        subject: `New Lecture Scheduled: ${courseTitle}`,
        text: `A new lecture has been scheduled.\n\nCourse: ${courseTitle}\nVenue: ${venue}\nTime: ${time}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
