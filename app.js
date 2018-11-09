const express = require('express');
const mustacheExpress = require('mustache-express');
const app = express();
const bodyParser = require('body-parser');
const pgp = require('pg-promise')();
const connectionString = "postgres://localhost:5432/vitaldb";
const db = pgp(connectionString);
const session = require('express-session');
const sess = {secret: 'keyboard cat', resave: false, saveUninitialized: false};
const models = require('./models');

// access to main.css file
app.use('/styles', express.static('styles'));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session(sess));

app.engine('mustache', mustacheExpress());

app.set('views', "./views"); 
app.set('view engine', 'mustache');

app.get('/', (req, res) => {
    res.render('index');
});















app.listen(3000, (req, res) => {
    console.log('Server running...');
});