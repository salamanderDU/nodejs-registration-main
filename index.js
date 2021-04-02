const express = require('express');
const path = require('path');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const dbConnection = require('./database');
const { body, validationResult } = require('express-validator');

const app = express();
app.use(express.urlencoded({extended:false}));

// SET OUR VIEWS AND VIEW ENGINE
app.set('views', path.join(__dirname,'views'));
app.set('view engine','ejs');
app.engine('ejs', require('ejs').__express);

// APPLY COOKIE SESSION MIDDLEWARE
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
    maxAge:  3600 * 1000 // 1hr
}));
console.log('cookie in use 22');

// DECLARING CUSTOM MIDDLEWARE
console.log('test session use will be use in next line')
const ifNotLoggedin = (req, res, next) => {
    console.log(!req.session.isLoggedIn);
    if(!req.session.isLoggedIn){
        console.log('hulay i use');
        return res.render('login-register');
    }
    next();
}
console.log('788');
const ifLoggedin = (req,res,next) => {
    if(req.session.isLoggedIn){
        console.log('789');
        return res.redirect('/home');
    }
    next();
}
// END OF CUSTOM MIDDLEWARE
// ROOT PAGE
app.get('/', ifNotLoggedin, (req,res,next) => {
    // chang the db and value ok
    console.log('root page get/ ifnotlogin 43');
    dbConnection.query("SELECT name FROM account WHERE id=$1",[req.session.userID])
    .then(rows => {
        console.log('render home 46');
        res.render('home',{
            name:rows["rows"][0].name
        });
    });
    
});// END OF ROOT PAGE


// REGISTER PAGE
app.post('/register', ifLoggedin, 
// post data validation(using express-validator)
[
    body('user_email','Invalid email address!').isEmail().custom((value) => {
        //chang db table and value ok
        console.log(req.session.userID);
        console.log('post/register iflogin 60')
        return dbConnection.query('SELECT email FROM account WHERE email = $1', [value])//add ;
        .then(rows => {
            if(rows.length > 0){
                return Promise.reject('This E-mail already in use!');
            }
            return true;
        });
    }),
    body('user_name','Username is Empty!').trim().not().isEmpty(),
    body('user_pass','The password must be of minimum length 6 characters').trim().isLength({ min: 6 }),
],// end of post data validation
(req,res,next) => {

    const validation_result = validationResult(req);
    console.log(req.session.userID);
    const {user_name, user_pass, user_email} = req.body;
    // IF validation_result HAS NO ERROR
    if(validation_result.isEmpty()){
        // password encryption (using bcryptjs)
        bcrypt.hash(user_pass, 12).then((hash_pass) => {
            // INSERTING USER INTO DATABASE
            //---chang table name users -> account password -> pass value-> ok
            console.log('query while insert 82')
            dbConnection.query("INSERT INTO account(name,email,pass) VALUES($1,$2,$3)",[user_name,user_email, hash_pass])
            .then(result => {
                res.send(`your account has been created successfully, Now you can <a href="/">Login</a>`);
            }).catch(err => {
                // THROW INSERTING USER ERROR'S
                if (err) throw err;
            });
        })
        .catch(err => {
            // THROW HASING ERROR'S
            if (err) throw err;
        })
    }
    else{
        // COLLECT ALL THE VALIDATION ERRORS
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH VALIDATION ERRORS
        console.log('render 103');
        res.render('login-register',{
            register_error:allErrors,
            old_data:req.body
        });
    }
});// END OF REGISTER PAGE


// LOGIN PAGE
app.post('/', ifLoggedin, [
    body('user_email').custom((value) => {
        // chang db and value
        return dbConnection.query('SELECT email FROM account WHERE email=$1', [value])
        .then(rows => {
            if(rows["rows"].length == 1){
                console.log(rows["rows"]);
                return true;               
            }
            console.log(rows["rows"]);
            // console.log(value);
            return Promise.reject('Invalid Email Address!'); 
        });
    }),
    body('user_pass','Password is empty!').trim().not().isEmpty(),
], (req, res) => {
    const validation_result = validationResult(req);
    const {user_pass, user_email} = req.body;
    if(validation_result.isEmpty()){
        //chang db table and value ok
        dbConnection.query("SELECT * FROM account WHERE email=$1",[user_email])
        .then(rows => {
            // console.log(rows);
            // console.log(rows["rows"][0].pass);
            bcrypt.compare(user_pass, rows["rows"][0].pass).then(compare_result => {
                if(compare_result === true){
                    console.log('murara');
                    req.session.isLoggedIn = true;
                    req.session.userID = rows["rows"][0].id;
                    console.log(req.session.userID);

                    res.redirect('/');
                }
                else{
                    console.log('render 145');
                    res.render('login-register',{
                        login_errors:['Invalid Password!']
                    });
                }
            })
            .catch(err => {
                if (err) throw err;
            });


        }).catch(err => {
            if (err) throw err;
        });
    }
    else{
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH LOGIN VALIDATION ERRORS
        console.log('render 165');
        res.render('login-register',{
            login_errors:allErrors
        });
    }
});
// END OF LOGIN PAGE

// LOGOUT
app.get('/logout',(req,res)=>{
    //session destroy
    req.session = null;
    res.redirect('/');
});
// END OF LOGOUT

app.use('/', (req,res) => {
    res.status(404).send('<h1>404 Page Not Found!</h1>');
    console.log(req.session.userID);
});



app.listen(3001, () => console.log("Server is Running..."));
