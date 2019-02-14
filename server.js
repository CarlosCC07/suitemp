const express = require('express');
const app = express()
const bodyParser = require('body-parser');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.render('index');
})

app.get('/clima', function (req, res) {
  let state = 0;
  let crumb = 'General';
  res.render('clima', {state, crumb});
})

app.post('/clima', function (req, res) {
  state = parseInt(req.body.state);
  //console.log(state);  	
  let crumb = 'Nuevo Estudio';
  res.render('clima', {state, crumb});
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})