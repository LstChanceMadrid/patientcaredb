const express = require('express');
const mustacheExpress = require('mustache-express');
const app = express();
const bodyParser = require('body-parser');
const pgp = require('pg-promise')();
const connectionString = "postgres://fmngwkmfyfhdxv:fa0290f880e479e8b59d5c6ce5a8b7d745aed09ca2ca2f26c8da42c56e6a231d@ec2-107-22-164-225.compute-1.amazonaws.com:5432/damvt1g6umvmn4?ssl=true";
const db = pgp(connectionString);
const session = require('express-session');
const sess = {secret: 'keyboard cat', resave: false, saveUninitialized: false};
const port = 3000;






// access to main.css file
app.use('/styles', express.static('styles'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session(sess));

app.engine('mustache', mustacheExpress());

app.set('views', "./views"); 
app.set('view engine', 'mustache');

// hospital login page

app.get('/', (req, res) => {
    res.render('./index');
});

app.post('/register-hospital', (req, res) => {

    let hospitalname = req.body.hospitalname;
    let accesscode = req.body.accesscode;
    let address = req.body.address;
    let city = req.body.city;
    let state = req.body.state;
    let zipcode = req.body.zipcode;
    let telephone = req.body.telephone;
    
    db.none('SELECT hospitalname, hospitalid FROM hospitals WHERE hospitalname = $1', [hospitalname])
    .then(() => {
            db.none('INSERT INTO hospitals(hospitalname, accesscode, address, city, state, zipcode, telephone) VALUES($1, $2, $3, $4, $5, $6, $7)', [hospitalname, accesscode, address, city, state, zipcode, telephone]).then(() => {
                db.one('SELECT hospitalname, hospitalid FROM hospitals WHERE hospitalname = $1', [hospitalname]).then(hospital => {
                    let hospitalid = hospital.hospitalid;
                    console.log(hospitalname)
                    res.redirect('/' + hospitalname + '/' + hospitalid + '/home');
                });
            });
    }).catch(e => {
        let errorType = e.name;

        if (errorType === 'QueryResultError') {
            let hospitalExistsTrue = "That hospital is already registered";

            res.render('./index', {hospitalExistsTrue : hospitalExistsTrue});
        } else {
            db.none('INSERT INTO hospitals(hospitalname, accesscode, address, city, state, zipcode, telephone) VALUES($1, $2, $3, $4, $5, $6, $7)', [hospitalname, accesscode, address, city, state, zipcode, telephone]).then(() => {
                console.log(hospitalname)
                res.redirect('/' + hospitalname + '/' + hospitalid + '/home');
            });
        }
        console.log(e);
    });
});

app.post('/log-in-hospital', (req, res) => {

    let hospitalname = req.body.hospitalname;
    let accesscode = req.body.accesscode;

    db.one('SELECT hospitalid, hospitalname FROM hospitals WHERE hospitalname = $1 AND accesscode = $2', [hospitalname, accesscode]).then(hospital => {
        if (hospital) {
            let hospitalname = hospital.hospitalname;
            let hospitalid = hospital.hospitalid;
            res.redirect('/' + hospitalname + '/' + hospitalid + '/home');
        } 
    }).catch(e => {
        let errorType = e.name;

        if ( errorType === 'QueryResultError') {

            let hospitalExistsFalse = "This is not a registered hospital";
            res.render('./index', {hospitalExistsFalse : hospitalExistsFalse});
        } else {
            console.log(e);
        }
    });
});



// employee login page
app.get('/:hospitalname/:hospitalid/home', (req, res) => {
    let hospitalid = req.params.hospitalid;

    db.one('SELECT hospitalname, address, city, state, zipcode, telephone, hospitalid FROM hospitals WHERE hospitalid = $1', [hospitalid]).then(hospital => {
        console.log(hospital)
        res.render('hospital-home', {hospital: hospital});
    });
});

app.post('/:hospitalname/:hospitalid/register-employee', (req, res) => {

    let hospitalname = req.params.hospitalname;
    let hospitalid = req.params.hospitalid;
    
    console.log(hospitalid)
    let username = req.body.username;
    let password = req.body.password;
    let employeefirstname = req.body.employeefirstname;
    let employeelastname = req.body.employeelastname;
    let address = req.body.address;
    let city = req.body.city;
    let state = req.body.state;
    let zipcode = req.body.zipcode;
    let telephone = req.body.telephone;
    
    db.none('SELECT username, employeeid FROM employees WHERE username = $1', [username])
    .then(() => {
        db.none('INSERT INTO employees(username, password, employeefirstname, employeelastname, address, city, state, zipcode, telephone, hospitalid) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [username, password, employeefirstname, employeelastname, address, city, state, zipcode, telephone, hospitalid]).then(() => {

            db.one('SELECT employees.username, employees.employeeid, hospitals.hospitalname, hospitals.hospitalid FROM employees INNER JOIN hospitals ON employees.hospitalid = hospitals.hospitalid WHERE username = $1', [username]).then(result => {

                let hospitalid = result.hospitalid;
                let hospitalname = result.hospitalname;

                let username = result.username;
                let employeeid = result.employeeid;

                console.log(username)
                console.log(hospitalname)

                res.redirect('/' + hospitalname + '/' + hospitalid + '/' + username + '/' + employeeid + '/home');
            });
        });
    }).catch(e => {
        let errorType = e.name;

        if (errorType === 'QueryResultError') {
            let employeeExistsTrue = "That hospital is already registered";

            res.render('./index', {employeeExistsTrue : employeeExistsTrue});
        } else {
            db.none('INSERT INTO employees(username, password, employeefirstname, employeelastname, address, city, state, zipcode, telephone, hospitalid) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [username, password, employeefirstname, employeelastname, address, city, state, zipcode, telephone, hospitalid]).then(() => {
                console.log(hospitalname)
                res.redirect('/' + hospitalname + '/' + hospitalid + '/home');
            });
        }
        console.log(e);
    });
});

app.post('/log-in-hospital', (req, res) => {

    let hospitalname = req.body.hospitalname;
    let accesscode = req.body.accesscode;

    db.one('SELECT hospitalid, hospitalname, accesscode FROM hospitals WHERE hospitalname = $1 AND accesscode = $2', [hospitalname, accesscode]).then(hospital => {
        if (hospital) {
            console.log(hospital)
            console.log(hospital.hospitalname)
            console.log(hospital.hospitalid)
            let hospitalname = hospital.hospitalname;
            let hospitalid = hospital.hospitalid;
            console.log(hospital.hospitalid);
            res.redirect('/' + hospitalname + '/' + hospitalid + '/home');
        } else {
            let hospitalExistsFalse = "This is not a registered hospital";
            console.log("its broken")
            res.render('./index', {hospitalExistsFalse : hospitalExistsFalse});
        }
    }).catch(e => {
        console.log(e);
    });
});













app.listen(port, (req, res) => {
    console.log('Server running...');
});