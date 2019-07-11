/*
** HEADER COMMENT TO BE ADDED LATER
*/

const express = require('express');
const app = express()
const bodyParser = require('body-parser');
const routes = require('./app/routes.js')

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.use('/', routes)

app.listen(3000, function () {
  console.log('Server running on port 3000!')
})