const express = require('express');
const mustacheExpress = require('mustache-express');
const app = express();
const bodyParser = require('body-parser');
const pgp = require('pg-promise')();
const connectionString = "postgres://fmngwkmfyfhdxv:fa0290f880e479e8b59d5c6ce5a8b7d745aed09ca2ca2f26c8da42c56e6a231d@ec2-107-22-164-225.compute-1.amazonaws.com:5432/damvt1g6umvmn4?ssl=true";
const db = pgp(connectionString);
const request = require('request');
const session = require('express-session');
const sess = {secret: 'keyboard cat', resave: false, saveUninitialized: false};
const port = 3000;


const HOSPITAL_PARAMS = '/:hospitalname/:hospitalid';
const EMPLOYEE_PARAMS = '/:username/:employeeid';


// access to main.css file
app.use('/styles', express.static('styles'));
app.use('/scripts', express.static('scripts'))

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
        };
    });
});


// employee login page

app.get(HOSPITAL_PARAMS + '/home', (req, res) => {
    let hospitalid = req.params.hospitalid;

    db.one('SELECT hospitalname, address, city, state, zipcode, telephone, hospitalid FROM hospitals WHERE hospitalid = $1', [hospitalid]).then(hospital => {

        res.render('hospital-home', {hospital: hospital});
    });
});

app.post(HOSPITAL_PARAMS + '/register-employee', (req, res) => {

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

                let hospitalname = result.hospitalname;
                let hospitalid = result.hospitalid;

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
        };
    });
});

app.post(HOSPITAL_PARAMS + '/log-in-employee', (req, res) => {
    
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

                let hospitalname = hospital.hospitalname;
                let hospitalid = hospital.hospitalid;
                res.redirect('/' + hospitalname + '/' + hospitalid + '/home');
            });
        } else {
            console.log(e);
        };
    });
});

app.get(HOSPITAL_PARAMS + EMPLOYEE_PARAMS + '/home',(req, res) => {

    let hospitalname = req.params.hospitalname;
    let hospitalid = req.params.hospitalid;
    let username = req.params.username;
    let employeeid = req.params.employeeid;

    db.any('SELECT patients.firstname, patients.lastname, patients.dob, patients.sex, hospitals.hospitalid FROM patients INNER JOIN hospitals ON hospitals.hospitalid = $1', [hospitalid]).then(patients => {
        res.render('employee-home', {patients : patients, hospitalname : hospitalname, hospitalid : hospitalid, username : username, employeeid : employeeid});
    }).catch(e => {
        console.log(e);
    });
});

app.get(HOSPITAL_PARAMS + EMPLOYEE_PARAMS + '/new-patient', (req, res) => {

    let employeeid = req.params.employeeid;

    db.one('SELECT employees.username, employees.employeeid, employees.hospitalid, hospitals.hospitalname, hospitals.hospitalid FROM employees INNER JOIN hospitals ON employees.hospitalid = hospitals.hospitalid WHERE employees.employeeid = $1', [employeeid]).then(result => {
        const countryname = [];

        // countries api
        request('https://restcountries.eu/rest/v2/all', (error, response, body) => {
            if (!error && response.statusCode == 200) {
                let info = JSON.parse(body);
                
                for (index in info) {
                    countryname.push({name : info[index].name});
                };
            };
            res.render('patients', {result : result, employeeid : employeeid, countryname : countryname});
        });
    }).catch(e => {
        console.log(e);
    });
});

app.post(HOSPITAL_PARAMS + EMPLOYEE_PARAMS + '/admit-patient', (req, res) => {

    let hospitalname = req.params.hospital;
    let hospitalid = req.params.hospitalid;
    let username = req.params.username;
    let employeeid = req.params.employeeid;
    
    let admissiondate = req.body.admissiondate;
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let dob = req.body.dob;
    let sex = req.body.sex;
    let maritalstatus = req.body.maritalstatus;
    let countryofbirth = req.body.countryofbirth;
    let address = req.body.address;
    let city = req.body.city;
    let state = req.body.state;
    let zipcode = req.body.zipcode;
    let telephone = req.body.telephone;
    let email = req.body.email;
    let religion = req.body.religion;
    let citizen = req.body.citizen;
    let reasonforvisit = req.body.reasonforvisit;
    let medication = req.body.medication;
    let drugallergies = req.body.drugallergies;
    let roomnumber = req.body.roomnumber;
    let dischargedate = req.body.dischargedate;
    let surgical = req.body.surgical;
    let medical = req.body.medical;
    let psychiatric = req.body.letpsychiatric;
    let admissiontype = req.body.admissiontype;
    let communication = req.body.communication;
    let vision = req.body.vision;
    let hearing = req.body.hearing;
    let assistivedevices = req.body.assistivedevices;
    let toileting = req.body.toileting;
    let medicationadministration = req.body.medicationadministration;
    let feeding = req.body.feeding;
    let diettexture = req.body.diettexture;
    let ambulation = req.body.ambulation;
    let personalhygiene = req.body.personalhygiene;
    let oralhygiene = req.body.oralhygiene;
    let headofbedelevated = req.body.headofbedelevated;
    let additionalnotes = req.body.additionalnotes;
    let diagnosis = req.body.diagnosis;
    let operations = req.body.operations;
    let bloodtype = req.body.bloodtype;
    let ethnicity = req.body.ethnicity;

    db.one('INSERT INTO patients(admissiondate, firstname, lastname, dob, sex, maritalstatus, countryofbirth, address, city, state, zipcode, telephone, email, religion, citizen, reasonforvisit, medication, drugallergies, roomnumber, hospitalid, dischargedate, surgical, medical, psychiatric, admissiontype, communication, vision, hearing, assistivedevices, toileting, medicationadministration, feeding, diettexture, ambulation, personalhygiene, oralhygiene, headofbedelevated, additionalnotes, diagnosis, operations, bloodtype, ethnicity) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42)', [admissiondate, firstname, lastname, dob, sex, maritalstatus, address, countryofbirth, city, state, zipcode, telephone, email, religion, citizen, reasonforvisit, medication, drugallergies, roomnumber, hospitalid, dischargedate, surgical, medical, psychiatric, admissiontype, communication, vision, hearing, assistivedevices, toileting, medicationadministration, feeding, diettexture, ambulation, personalhygiene, oralhygiene, headofbedelevated, additionalnotes, diagnosis, operations, bloodtype, ethnicity]).then(() => {

        res.redirect('/' + hospitalname + '/' + hospitalid + '/' + username + '/' + employeeid + '/home');
    }).catch(e => {
        console.log(e);
    });
});

// app.post(HOSPITAL_PARAMS + EMPLOYEE_PARAMS + '/:patientid/patient-info', (req, res) => {
//     let hospitalid = req.params.hospitalid;
//     let patientid = req.params.patientid;
    
//     db.one('SELECT * FROM patients WHERE hospitals.hospitalid = patients.hospitalid AND patients.patientid = $2', [hospitalid, patientid]).then(patient => {
//         res.render('patient-info', {patient : patient});
//     }).catch(e => {
//         console.log(e);
//     });
// });

app.get(HOSPITAL_PARAMS + EMPLOYEE_PARAMS + '/:patientid/patient-info', (req, res) => {
    let patientid = req.params.patientid;
    db.one('SELECT * FROM patients WHERE patientid = $1', [patientid]).then(patient => {
        res.render('patient-info', {patient : patient});
    }).catch(e => {
        console.log(e);
    });
});

app.post(HOSPITAL_PARAMS + EMPLOYEE_PARAMS + '/:patientid/edit-info', (req, res) => {
    
    let hospitalname = req.params.hospital;
    let hospitalid = req.params.hospitalid;
    let username = req.params.username;
    let employeeid = req.params.employeeid;
    let patientid = req.params.patientid;
    
    let admissiondate = req.body.admissiondate;
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let dob = req.body.dob;
    let sex = req.body.sex;
    let maritalstatus = req.body.maritalstatus;
    let countryofbirth = req.body.countryofbirth;
    let address = req.body.address;
    let city = req.body.city;
    let state = req.body.state;
    let zipcode = req.body.zipcode;
    let telephone = req.body.telephone;
    let email = req.body.email;
    let religion = req.body.religion;
    let citizen = req.body.citizen;
    let reasonforvisit = req.body.reasonforvisit;
    let medication = req.body.medication;
    let drugallergies = req.body.drugallergies;
    let roomnumber = req.body.roomnumber;
    let dischargedate = req.body.dischargedate;
    let surgical = req.body.surgical;
    let medical = req.body.medical;
    let psychiatric = req.body.letpsychiatric;
    let admissiontype = req.body.admissiontype;
    let communication = req.body.communication;
    let vision = req.body.vision;
    let hearing = req.body.hearing;
    let assistivedevices = req.body.assistivedevices;
    let toileting = req.body.toileting;
    let medicationadministration = req.body.medicationadministration;
    let feeding = req.body.feeding;
    let diettexture = req.body.diettexture;
    let ambulation = req.body.ambulation;
    let personalhygiene = req.body.personalhygiene;
    let oralhygiene = req.body.oralhygiene;
    let headofbedelevated = req.body.headofbedelevated;
    let additionalnotes = req.body.additionalnotes;
    let diagnosis = req.body.diagnosis;
    let operations = req.body.operations;
    let bloodtype = req.body.bloodtype;
    let ethnicity = req.body.ethnicity;

    db.one('UPDATE patients SET admissiondate = $1, firstname = $2, lastname = $3, dob = $4, sex = $5, maritalstatus = $6, countryofbirth = $7, address = $8, city = $9, state = $10, zipcode = $11, telephone = $12, email = $13, religion = $14, citizen = $15, reasonforvisit = $16, medication = $17, drugallergies = $18, roomnumber = $19, hospitalid = $20, dischargedate = $21, surgical = $22, medical = $23, psychiatric = $24, admissiontype = $25, communication = $26, vision = $27, hearing = $28, assistivedevices = $29, toileting = $30, medicationadministration = $31, feeding = $32, diettexture = $33, ambulation = $34, personalhygiene = $35, oralhygiene = $36, headofbedelevated = $37, additionalnotes = $38, diagnosis = $39, operations = $40, bloodtype = $41, ethnicity = $42 WHERE patientid = $43', [admissiondate, firstname, lastname, dob, sex, maritalstatus, countryofbirth, address, city, state, zipcode, telephone, email, religion, citizen, reasonforvisit, medication, drugallergies, roomnumber, hospitalid, dischargedate, surgical, medical, psychiatric, admissiontype, communication, vision, hearing, assistivedevices, toileting, medicationadministration, feeding, diettexture, ambulation, personalhygiene, oralhygiene, headofbedelevated, additionalnotes, diagnosis, operations, bloodtype, ethnicity, patientid]).then(() => {
        res.redirect('/' + hospitalname + '/' + hospitalid + '/' + username + '/' + employeeid + '/:patientid/patient-info');
    }).catch(e => {
        console.log(e);
    })
})





app.listen(port, (req, res) => {
    console.log('Server running...');
});