/*
** HEADER COMMENT TO BE ADDED LATER
*/

const express = require('express');
const app = express()
const bodyParser = require('body-parser');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// MySQL Connection
var mysql = require('mysql')
var con = mysql.createConnection({
  host     : 'localhost',
  user     : 'carlos',
  password : 'brisa'
});

con.connect()

// *************************************************************************************
// FUNCTION DECLARATIONS
// *************************************************************************************
function create_tables(dbname, se, ce, oe) {
  con.changeUser({database : dbname}, function(err) {
    if (err) throw err;
  });

  var sql_table_empresa = "CREATE TABLE empresa (id INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(255), year INT, escala INT)";
  con.query(sql_table_empresa, function (err, result) {
    if (err) throw err;
    console.log("Table empresa created successfully");
  });

  var sql_table_plantas = "CREATE TABLE plantas (id INT AUTO_INCREMENT PRIMARY KEY, planta VARCHAR(255))";
  con.query(sql_table_plantas, function (err, result) {
    if (err) throw err;
    console.log("Table plantas created successfully");
  });

  var sql_table_generales = "CREATE TABLE generales (id INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(255))";
  con.query(sql_table_generales, function (err, result) {
    if (err) throw err;
    console.log("Table generales created successfully");
  });

  var sql_table_generales_resp = "CREATE TABLE generales_respuestas (folio_id INT, general_id INT, respuesta VARCHAR(255))";
  con.query(sql_table_generales_resp, function (err, result) {
    if (err) throw err;
    console.log("Table generales_respuestas created successfully");
  });

    var sql_table_reactivos = "CREATE TABLE reactivos (id INT AUTO_INCREMENT PRIMARY KEY, rubro VARCHAR(255), factor VARCHAR(255), reactivo TEXT)";
  con.query(sql_table_reactivos, function (err, result) {
    if (err) throw err;
    console.log("Table reactivos created successfully");
  });

  var sql_table_global = "CREATE TABLE global (folio_id INT, reactivo_id INT, respuesta INT)";
  con.query(sql_table_global, function (err, result) {
    if (err) throw err;
    console.log("Table global created successfully");
  });

  if (se == 0) {
    var sql_table_servicios = "CREATE TABLE servicios (id INT AUTO_INCREMENT PRIMARY KEY, servicio VARCHAR(255))";
    con.query(sql_table_servicios, function (err, result) {
      if (err) throw err;
      console.log("Table servicios created successfully");
    });

    var sql_table_servicios_resp = "CREATE TABLE servicios_respuestas (folio_id INT, servicio_id INT, respuesta INT)";
    con.query(sql_table_servicios_resp, function (err, result) {
      if (err) throw err;
      console.log("Table servicios_respuestas created successfully");
    });
  }

  if (ce == 0) {
    var sql_table_comentarios = "CREATE TABLE comentarios (folio_id INT, pregunta VARCHAR(255), comentario TEXT)";
    con.query(sql_table_comentarios, function (err, result) {
      if (err) throw err;
      console.log("Table comentarios created successfully");
    });
  }

  if (oe == 0) {
    var sql_table_otras = "CREATE TABLE otras (folio_id INT, pregunta VARCHAR(255), respuesta TEXT)";
    con.query(sql_table_otras, function (err, result) {
      if (err) throw err;
      console.log("Table otras created successfully");
    });
  }  
}

// *************************************************************************************
// ROUTE DEFINITIONS
// *************************************************************************************

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
  let empresa = req.body.select_empresa; // This will be modified to work with ID value instead of name
  let planta = req.body.planta_input;
  let year = parseInt(req.body.year_input);
  let generales = req.body.generales_input.toLowerCase();
  let reactivos = req.body.reactivos_file;
  let servicios_enabled = parseInt(req.body.servicios_check);
  let comentarios_enabled = parseInt(req.body.comentarios_check);
  let otras_enabled = parseInt(req.body.otras_check);
  let servicios = req.body.servicios_input.toLowerCase();
  let otras = parseInt(req.body.otras_input);
  
  let dbname = empresa + year;
  let db_query = "CREATE DATABASE " + dbname;
  con.query(db_query, function (err, result) {
    if (err) throw err;
    console.log("Database " + dbname + " created successfully");
  });

  // var arr_plantas = planta.split(",");

  create_tables(dbname, servicios_enabled, comentarios_enabled, otras_enabled, function(err, result)  {
      if (err) throw err;
  });

  let crumb = 'Nuevo Estudio';
  state = 1;
  res.render('clima_upload', {crumb});
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})