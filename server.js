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

app.post('/clima_upload', function (req, res) {
  let escala = parseInt(req.body.escala_radio);
  let empresa = parseInt(req.body.select_empresa);
  let planta = req.body.planta_input;
  let year = parseInt(req.body.year_input);
  let generales = req.body.generales_input.toLowerCase();
  let reactivos = req.body.reactivos_file;
  let servicios_enabled = parseInt(req.body.servicios_check);
  let comentarios_enabled = parseInt(req.body.comentarios_check);
  let otras_enabled = parseInt(req.body.otras_check);
  let servicios = req.body.servicios_input.toLowerCase();
  let otras = parseInt(req.body.otras_input);
  
  let crumb = 'Nuevo Estudio';
  state = 1;
  res.render('clima', {state, crumb});
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})