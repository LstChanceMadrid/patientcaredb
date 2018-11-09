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
const port = process.env.PORT || 3000;




const DATABASE_URL = "postgresql-polished-34740"

const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

client.connect();

client.query('SELECT table_schema,table_name FROM information_schema.tables;', (err, res) => {
  if (err) throw err;
  for (let row of res.rows) {
    console.log(JSON.stringify(row));
  }
  client.end();
});




// access to main.css file
app.use('/styles', express.static('styles'));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session(sess));

app.engine('mustache', mustacheExpress());

app.set('views', "./views"); 
app.set('view engine', 'mustache');

app.get('/', (req, res) => {
    res.render('./index');
});















app.listen(port, (req, res) => {
    console.log('Server running...');
});