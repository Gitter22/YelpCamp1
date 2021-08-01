if(process.env.Node_ENV !=='production') {
    require('dotenv').config();
}

const express=require('express')
const mongoose=require('mongoose')
const path=require('path')
const methodOverride = require('method-override') 
const app=express();
const ejsMate=require('ejs-mate')
const ExpressError=require('./utils/ExpressError')
const campgroundRoutes=require('./routes/campground')
const reviewRoutes=require('./routes/review')
const session=require('express-session')
const flash=require('connect-flash')
const passport=require('passport')
const localStrategy=require('passport-local')
const User=require('./models/user')
const userRoutes=require('./routes/users')
const mongoSanitize=require('express-mongo-sanitize')
const helmet = require("helmet");
const MongoDBStore = require('connect-mongo');



// const dbUrl=process.env.DB_URL
const dbUrl='mongodb://localhost:27017/yelpCamp'
// mongodb://localhost:27017/yelpCamp
mongoose.connect(dbUrl, 
{ useNewUrlParser: true, 
useUnifiedTopology: true,
useCreateIndex: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("database connection successful")
});

app.set('view engine','ejs')
app.set('views', path.join(__dirname, 'views'))

app.engine('ejs',ejsMate)

app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method')) 
app.use(express.static(path.join(__dirname, 'public')))
app.use(mongoSanitize())

const store=MongoDBStore.create({
mongoUrl:dbUrl,
secret:'secretsecret',
touchAfter:24*3600,
})
store.on("error",function(e){
    console.log("Session Store error",e)
})

app.use(session({
    store,
    secret:'secretsecret',
    name:'timepass',
    resave:false,
    saveUninitialized:true,
    cookie:{
        
        expires:Date.now()+1000*60*60*24*7,
        maxAge:1000*60*60*24*7,
        httpOnly:true,
        // secure:true,
      
        }
}))
app.use(flash())
app.use(helmet());


const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/yelpyelpcamp/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use((req,res,next)=>{
    res.locals.success=req.flash('success')
    res.locals.error=req.flash('error')
    res.locals.currentUser=req.user
    next();
})

app.use('/campgrounds',campgroundRoutes)
app.use('/campgrounds/:id/reviews',reviewRoutes)
app.use('/',userRoutes)



app.get('/', (req,res)=>{
    res.render('home')
})



app.all('*',(req,res,next)=>{
next(new ExpressError('Page not Found',404))
})
app.use((err,req,res,next)=>{
    const {statusCode=500}=err
    if(!err.message) err.message="Oh no! Something went wrong!"
    res.status(statusCode).render('error',{err})   
})

app.listen(3000,(req,res)=>{
    console.log("YelpCamp Listening on Port 3000")
})
