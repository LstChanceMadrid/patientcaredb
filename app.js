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
    
    db.none('SELECT hospitalname, hospitalid FROM hospitals WHERE hospitalname = $1', [hospitalname]).then(() => {
        db.none('INSERT INTO hospitals(hospitalname, accesscode, address, city, state, zipcode, telephone) VALUES($1, $2, $3, $4, $5, $6, $7)', [hospitalname, accesscode, address, city, state, zipcode, telephone]).then(() => {
            db.one('SELECT hospitalname, hospitalid FROM hospitals WHERE hospitalname = $1', [hospitalname]).then(hospital => {
                let hospitalid = hospital.hospitalid;
                res.redirect('/' + hospitalname + '/' + hospitalid + '/home');
            });
        });
    }).catch(e => {
        let errorType = e.name;
        if (errorType === 'QueryResultError') {
            res.redirect('..');
        } else {
            console.log(e);
        }
    });
});

app.post('/log-in-hospital', (req, res) => {

    let hospitalname = req.body.hospitalname;
    let accesscode = req.body.accesscode;

    db.one('SELECT hospitalid, hospitalname FROM hospitals WHERE hospitalname = $1 AND accesscode = $2', [hospitalname, accesscode]).then(hospital => {
        let hospitalname = hospital.hospitalname;
        let hospitalid = hospital.hospitalid;

        res.redirect('/' + hospitalname + '/' + hospitalid + '/home');
    }).catch(e => {
        let errorType = e.name;

        if ( errorType === 'QueryResultError') {
            res.redirect('..');
        } else {
            console.log(e);
        }
    });
});


// employee login page

app.get('/:hospitalname/:hospitalid/home', (req, res) => {
    let hospitalid = req.params.hospitalid;

    db.one('SELECT hospitalname, address, city, state, zipcode, telephone, hospitalid FROM hospitals WHERE hospitalid = $1', [hospitalid]).then(hospital => {

        res.render('hospital-home', {hospital: hospital});
    });
});

app.post('/:hospitalname/:hospitalid/register-employee', (req, res) => {

    let hospitalid = req.params.hospitalid;

    let username = req.body.username;
    let password = req.body.password;
    let employeefirstname = req.body.employeefirstname;
    let employeelastname = req.body.employeelastname;
    let address = req.body.address;
    let city = req.body.city;
    let state = req.body.state;
    let zipcode = req.body.zipcode;
    let telephone = req.body.telephone;
    
    db.none('SELECT username, employeeid FROM employees WHERE username = $1', [username]).then(() => {

        db.none('INSERT INTO employees(username, password, employeefirstname, employeelastname, address, city, state, zipcode, telephone, hospitalid) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [username, password, employeefirstname, employeelastname, address, city, state, zipcode, telephone, hospitalid]).then(() => {

            db.one('SELECT employees.username, employees.employeeid, hospitals.hospitalname, hospitals.hospitalid FROM employees INNER JOIN hospitals ON employees.hospitalid = hospitals.hospitalid WHERE username = $1', [username]).then(result => {

                let hospitalid = result.hospitalid;
                let hospitalname = result.hospitalname;

                let username = result.username;
                let employeeid = result.employeeid;

                res.redirect('/' + hospitalname + '/' + hospitalid + '/' + username + '/' + employeeid + '/home');
            });
        });
    }).catch(e => {
        let errorType = e.name;

        if (errorType === 'QueryResultError') {
            db.one('SELECT hospitalname, address, city, state, zipcode, telephone, hospitalid FROM hospitals WHERE hospitalid = $1', [hospitalid]).then(hospital => {

                let hospitalname = hospital.hospitalname;
                let hospitalid = hospital.hospitalid;
                res.redirect('/' + hospitalname + '/' + hospitalid + '/home');
            });
        } else {
            console.log(e);
        }
    });
});

app.post('/:hospitalname/:hospitalid/log-in-employee', (req, res) => {
    let hospitalname = req.params.hospitalname;
    
    let username = req.body.username;
    let password = req.body.password;

    db.one('SELECT employees.employeeid, employees.username, employees.password, hospitals.hospitalname, hospitals.hospitalid FROM employees INNER JOIN hospitals ON employees.hospitalid = hospitals.hospitalid WHERE employees.username = $1 AND employees.password = $2', [username, password]).then(result => {

        let hospitalname = result.hospitalname;
        let hospitalid = result.hospitalid;

        let username = result.username;
        let employeeid = result.employeeid;

        res.redirect('/' + hospitalname + '/' + hospitalid + '/' + username + '/' + employeeid + '/home');
        
    }).catch(e => {
        let errorType = e.name;

        if (errorType === 'QueryResultError') {
            db.one('SELECT hospitalid, hospitalname, address, city, state, zipcode, telephone FROM hospitals WHERE hospitalname = $1', [hospitalname]).then(hospital => {

                let hospitalname = hospital.hospitalname
                let hospitalid = hospital.hospitalid
                res.redirect('/' + hospitalname + '/' + hospitalid + '/home');
            });
        } else {
            console.log(e);
        }
    });
});

app.get('/:hospitalname/:hospitalid/:username/:employeeid/home',(req, res) => {

    let hospitalname = req.params.hospitalname;
    let hospitalid = req.params.hospitalid;
    let username = req.params.username;
    let employeeid = req.params.employeeid;

    db.any('SELECT patients.firstname, patients.lastname, patients.dateofbirth, patients.gender FROM patients WHERE hospitals.hospitalid = $1', [hospitalid]).then(patients => {
        res.render('employee-home', {patients : patients});
        });
});

app.post('/:hospitalname/:hospitalid/:username/:employeeid/admit-patient', (req, res) => {

    let hospitalname = req.params.hospital;
    let hospitalid = req.params.hospitalid;
    let username = req.params.username;
    let employeeid = req.params.employeeid;
    
    let admissiondate = req.body.admissiondate
    let firstname = reg.body.firstname;
    let lastname = reg.body.lastname;
    let dateofbirth = reg.body.dateofbirth;
    let gender = reg.body.gender;
    let address = reg.body.address;
    let city = req.body.city;
    let state = req.body.state;
    let zipcode = req.body.zipcode;
    let reasonforvisit = reg.body.reasonforvisit;
    let medication = reg.body.medication;
    let drugallergies = reg.body.drugallergies;
    let roomnumber = reg.body.roomnumber;
    let dischargedate = req.body.dischargedate;

    db.one('INSERT INTO patients(admissiondate, firstname, lastname, dateofbirth, gender, address, city, state, zipcode, reasonforvisit, medication, drugallergies, roomnumber, hospitalid, dischargedate) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)', [admissiondate, firstname, lastname, dateofbirth, gender, address, city, state, zipcode, reasonforvisit, medication, drugallergies, roomnumber, hospitalid, dischargedate]).then(() => {

        res.redirect('/' + hospitalname + '/' + hospitalid + '/' + username + '/' + employeeid + '/home');
    });
});

app.post('/:hospitalname/:hospitalid/:username/:employeeid/:patientid/patient-info', (req, res) => {
    let hospitalname = req.params.hospital;
    let hospitalid = req.params.hospitalid;
    let username = req.params.username;
    let employeeid = req.params.employeeid;
    let patientid = req.params.patientid;
    
    db.one('SELECT * FROM patients WHERE hospitals.hospitalid = patients.hospitalid AND patients.patientid = $2', [hospitalid, patientid]).then(patient => {
        res.render('patient-info', {patient : patient});
    });
});

app.get('/:hospitalname/:hospitalid/:username/:employeeid/:patientid/patient-info', (req, res) => {

    db.one('SELECT * FROM patients WHERE patientid = $1', [patientid]).then(patient => {
        res.render('patient-info', {patient : patient});
    });
})

app.post('/:hospitalname/:hospitalid/:username/:employeeid/:patientid/edit-info', (req, res) => {
    
    let hospitalname = req.params.hospital;
    let hospitalid = req.params.hospitalid;
    let username = req.params.username;
    let employeeid = req.params.employeeid;
    let patientid = req.params.patientid;
    
    let firstname = reg.body.firstname;
    let lastname = reg.body.lastname;
    let dateofbirth = reg.body.dateofbirth;
    let gender = reg.body.gender;
    let address = reg.body.address;
    let city = req.body.city;
    let state = req.body.state;
    let zipcode = req.body.zipcode;
    let reasonforvisit = reg.body.reasonforvisit;
    let medication = reg.body.medication;
    let drugallergies = reg.body.drugallergies;
    let roomnumber = reg.body.roomnumber;
    let dischargedate = req.body.dischargedate;

    db.one('UPDATE patients SET firstname = $1, lastname = $2, dateofbirth = $3, gender = $4, address = $5, city = $6, state = $7, zipcode = $8, reasonforvisit = $9, medication = $10, drugallergies = $11, roomnumber = $12, dischargedate = $13 WHERE patientid = $14', [firstname, lastname, dateofbirth, gender, address, city, state, zipcode, reasonforvisit, medication, drugallergies, roomnumber, dischargedate, patientid]).then(() => {
        res.redirect('/' + hospitalname + '/' + hospitalid + '/' + username + '/' + employeeid + '/:patientid/patient-info');
    })
})





app.listen(port, (req, res) => {
    console.log('Server running...');
});