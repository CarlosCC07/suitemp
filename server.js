/*
** HEADER COMMENT TO BE ADDED LATER
*/

const express = require('express');
const app = express()
const bodyParser = require('body-parser');

// File Reader dependencies
// var util = require("util");
var fs = require("fs"); 
var multer = require('multer');
var csv = require('csv-array');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
  }
})
var upload = multer({ storage: storage })

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
  
  var sql_table_empresa = "CREATE TABLE empresa (id INT PRIMARY KEY, nombre VARCHAR(255), year INT, escala INT, num_reactivos INT, num_generales INT, num_servicios INT, comentarios INT, num_otras INT)";
  con.query(sql_table_empresa, function (err, result) {
    if (err) throw err;
    // console.log("Table empresa created successfully");
  });

  var sql_table_plantas = "CREATE TABLE plantas (id INT AUTO_INCREMENT PRIMARY KEY, planta VARCHAR(255))";
  con.query(sql_table_plantas, function (err, result) {
    if (err) throw err;
    // console.log("Table plantas created successfully");
  });

  var sql_table_generales = "CREATE TABLE generales (id INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(255))";
  con.query(sql_table_generales, function (err, result) {
    if (err) throw err;
    // console.log("Table generales created successfully");
  });

  var sql_table_generales_resp = "CREATE TABLE generales_respuestas (folio_id INT, general_id INT, respuesta VARCHAR(255))";
  con.query(sql_table_generales_resp, function (err, result) {
    if (err) throw err;
    // console.log("Table generales_respuestas created successfully");
  });

    var sql_table_reactivos = "CREATE TABLE reactivos (id INT AUTO_INCREMENT PRIMARY KEY, rubro VARCHAR(255), factor VARCHAR(255), reactivo TEXT)";
  con.query(sql_table_reactivos, function (err, result) {
    if (err) throw err;
    // console.log("Table reactivos created successfully");
  });

  var sql_table_global = "CREATE TABLE global (folio_id INT, reactivo_id INT, respuesta INT)";
  con.query(sql_table_global, function (err, result) {
    if (err) throw err;
    // console.log("Table global created successfully");
  });

  if (se == 0) {
    var sql_table_servicios = "CREATE TABLE servicios (id INT AUTO_INCREMENT PRIMARY KEY, servicio VARCHAR(255))";
    con.query(sql_table_servicios, function (err, result) {
      if (err) throw err;
      // console.log("Table servicios created successfully");
    });

    var sql_table_servicios_resp = "CREATE TABLE servicios_respuestas (folio_id INT, servicio_id INT, respuesta INT)";
    con.query(sql_table_servicios_resp, function (err, result) {
      if (err) throw err;
      // console.log("Table servicios_respuestas created successfully");
    });
  }

  if (ce == 0) {
    var sql_table_comentarios = "CREATE TABLE comentarios (folio_id INT, comentario TEXT)";
    con.query(sql_table_comentarios, function (err, result) {
      if (err) throw err;
      // console.log("Table comentarios created successfully");
    });
  }

  if (oe == 0) {
    var sql_table_otrasp = "CREATE TABLE otras_preguntas (id INT AUTO_INCREMENT PRIMARY KEY, pregunta VARCHAR(255))";
    con.query(sql_table_otrasp, function (err, result) {
      if (err) throw err;
      // console.log("Table otras created successfully");
    });

    var sql_table_otrasr = "CREATE TABLE otras_respuestas (folio_id INT, pregunta_id INT, respuesta TEXT)";
    con.query(sql_table_otrasr, function (err, result) {
      if (err) throw err;
      // console.log("Table otras created successfully");
    });
  }  
}

function parse_reactivos() {
  csv.parseCSV("./uploads/reactivos.csv", function(data){
   // console.log(JSON.stringify(data));
   for (i = 0; i < data.length; i++) {
    var sql_insert_reactivos = "INSERT INTO reactivos (id, rubro, factor, reactivo) VALUES (" + data[i][0] + ", '" + data[i][1] + "', '" + data[i][2] + "', '" + data[i][3] + "')";
      con.query(sql_insert_reactivos, function (err, result) {
        if (err) throw err;
      });
   }
 }, false);
}

function parse_otras() {
  csv.parseCSV("./uploads/otras.csv", function(data){
   // console.log(JSON.stringify(data));
   for (i = 0; i < data.length; i++) {
    var sql_insert_otras = "INSERT INTO otras_preguntas (pregunta) VALUES ('" + data[i] + "')";
      con.query(sql_insert_otras, function (err, result) {
        if (err) throw err;
      });
   }
 }, false);
}

function parse_global(nr, escala) {
  csv.parseCSV("./uploads/global.csv", function(data){
   // console.log(JSON.stringify(data));
   for (i = 0; i < data.length; i++) {
     for (j = 0; j < nr; j++) {
        t = j+1;
        let resp  = 0;
        if (escala == 2) {
          if (data[i][t] == "Totalmente de acuerdo") {
            resp = 100;
          } else if (data[i][t] == "De acuerdo") {
            resp = 80;
          } else if (data[i][t] == "En desacuerdo") {
            resp = 40;
          } else if (data[i][t] == "Totalmente en desacuerdo") {
            resp = 0;
          } 
        } else {
          if (data[i][t] == "Totalmente de acuerdo") {
            resp = 100;
          } else if (data[i][t] == "De acuerdo") {
            resp = 75;
          } else if (data[i][t] == "En desacuerdo") {
            resp = 25;
          } else if (data[i][t] == "Totalmente en desacuerdo") {
            resp = 0;
          } 
        }
        var sql_data = "INSERT INTO global (folio_id, reactivo_id, respuesta) VALUES (" + data[i][0] + ", " + t + ", " + resp + ")";
        con.query(sql_data, function (err, result) {
          if (err) throw err;
        });
      }    
   }
 }, false);
}

function parse_generales(ng, ns, nc, no, escala) {
  csv.parseCSV("./uploads/generales.csv", function(data){
   // console.log(JSON.stringify(data));
   for (i = 0; i < data.length; i++) {
    let k = 1;
    for (j = 0; j < ng; j++) {
      t = j+1;
      var sql_data = "INSERT INTO generales_respuestas (folio_id, general_id, respuesta) VALUES (" + data[i][0] + ", " + t + ", '" + data[i][k] + "')";
      con.query(sql_data, function (err, result) {
        if (err) throw err;
      });
      k++;
    }
    if (ns > 0) {
      for (j = 0; j < ns; j++) {
        t = j+1;
        let resp  = 0;
        if (escala == 2) {
          if (data[i][k] == "Excelente") {
            resp = 100;
          } else if (data[i][k] == "Bueno") {
            resp = 80;
          } else if (data[i][k] == "Regular") {
            resp = 40;
          } else if (data[i][k] == "Malo") {
            resp = 0;
          }  else {
            resp = -1;
          }
        } else {
          if (data[i][k] == "Excelente") {
            resp = 100;
          } else if (data[i][k] == "Bueno") {
            resp = 75;
          } else if (data[i][k] == "Regular") {
            resp = 25;
          } else if (data[i][k] == "Malo") {
            resp = 0;
          } else {
            resp = -1;
          }
        }
        var sql_data = "INSERT INTO servicios_respuestas (folio_id, servicio_id, respuesta) VALUES (" + data[i][0] + ", " + t + ", " + resp + ")";
        con.query(sql_data, function (err, result) {
          if (err) throw err;
        });
        k++;
      }
    }
    if (nc == 0) {
      var sql_data = "INSERT INTO comentarios (folio_id, comentario) VALUES (" + data[i][0] + ", '" + data[i][k] + "')";
      con.query(sql_data, function (err, result) {
        if (err) throw err;
      });
      k++;
    }
    if (no > 0) {
      for (j = 0; j < no; j++) {
        t = j+1;
        var sql_data = "INSERT INTO otras_respuestas (folio_id, pregunta_id, respuesta) VALUES (" + data[i][0] + ", " + t + ", '" + data[i][k] + "')";
        con.query(sql_data, function (err, result) {
          if (err) throw err;
        });
        k++;
      }
    }
   }
 }, false);
}

// *************************************************************************************
// ROUTE DEFINITIONS
// *************************************************************************************

app.get('/', function (req, res) {
  con.changeUser({database : "suitemp"}, function(err) {
      if (err) throw err;
    });
  res.render('index');
})

app.get('/empresas', function (req, res) {
  con.query("SELECT * FROM empresas", function (err, result, fields) {
    if (err) throw err;
    let state = 0;
    let crumb = 'Empresas';
    let data = result;
    res.render('empresas', {state, crumb, data});
  });
})

app.post('/empresas', upload.none(), function (req, res) {
  state = parseInt(req.body.state);
  if (state == 1) { 
    let crumb = 'Registrar Empresas';
    res.render('empresas', {state, crumb});
  } else if (state == 2) {
    let nombre = req.body.nombre_input;
    let giro = req.body.giro_input;

    var sql_insert_empresa = "INSERT INTO empresas (nombre, giro) VALUES ('" + nombre + "', '" + giro + "')";
    con.query(sql_insert_empresa, function (err, result) {
      if (err) throw err;
    });

    let crumb = 'Registrar Empresas';
    res.render('empresas', {state, crumb});
  }
})

app.get('/usuarios', function (req, res) {
  let crumb = 'Usuarios';
  res.render('usuarios', {crumb});
})

app.get('/editar_clima', function (req, res) {
  dbname = req.query.dbname;
  con.changeUser({database : dbname}, function(err) {
      if (err) throw err;
      console.log('Changed to DB ' + dbname)
  });
  let state = 0;
  let crumb = 'Editar Estudio';
  res.render('editar_clima', {state, crumb});
})

app.post('/editar_clima', upload.array('reactivos_file'), function (req, res) {
  state = req.body.state;
  if (state == 1) {
    let crumb = 'Editar Estudio';
    res.render('editar_clima', {state, crumb});
  } else if (state == 2) {
    var data = [];
    con.query("SELECT * FROM empresa", function (err, result, fields) {
      if(err) {
        throw err;
      } else {
        setValue(result);
      }
    });
    function setValue(value) {
      data = value;
      // console.log(data[0].num_reactivos);
      // parse_global(data[0].num_reactivos, data[0].escala, function(err, result)  { if (err) throw err; });
      parse_generales(data[0].num_generales, data[0].num_servicios, data[0].comentarios, data[0].num_otras, data[0].escala, function(err, result)  { if (err) throw err; });
      let crumb = 'Editar Estudio';
      res.render('editar_clima', {state, crumb});
    }
  }
})

app.get('/clima', function (req, res) {
  con.changeUser({database : "suitemp"}, function(err) {
      if (err) throw err;
    });

  con.query("SELECT * FROM clima", function (err, result, fields) {
    if (err) throw err;
    let state = 0;
    let crumb = 'General';
    let data = result;
    res.render('clima', {state, crumb, data});
  });
})

app.post('/clima', upload.array('reactivos_file'), function (req, res) {
  state = parseInt(req.body.state);
  if(state == 0 ) {
    con.query("SELECT * FROM clima", function (err, result, fields) {
      if (err) throw err;
      let state = 0;
      let crumb = 'General';
      let data = result;
      res.render('clima', {state, crumb, data});
    });
  } else if (state == 1) {
    con.query("SELECT * FROM empresas", function (err, result, fields) {
      if (err) throw err;
      let state = 1;
      let crumb = 'Nuevo Estudio';
      let data = result;
      res.render('clima', {state, crumb, data});
    });
  } else if (state == 2) {
    let escala = parseInt(req.body.escala_radio);
    let arr_empresa = req.body.select_empresa.split(",");
    let planta = req.body.planta_input;
    let year = parseInt(req.body.year_input);
    let generales = req.body.generales_input;
    let num_reactivos = parseInt(req.body.reactivos_input);
    let servicios_enabled = parseInt(req.body.servicios_check);
    let comentarios_enabled = parseInt(req.body.comentarios_check);
    let otras_enabled = parseInt(req.body.otras_check);
    let arr_servicios = req.body.servicios_input.split(",");
    let otras = parseInt(req.body.otras_input);

    let empresa = arr_empresa[0];
    let empresa_id = parseInt(arr_empresa[1]);

    var sql_insert_analisis = "INSERT INTO clima (empresa_id, nombre, year, plantas, escala) VALUES (" + empresa_id + ", '" + empresa + "', " + year + ", '" + planta + "', " + escala + ")";
    con.query(sql_insert_analisis, function (err, result) {
      if (err) throw err;
    });

    let dbname = empresa + year;
    let db_query = "CREATE DATABASE IF NOT EXISTS " + dbname + " COLLATE utf8_general_ci";
    con.query(db_query, function (err, result) {
      if (err) throw err;
      // console.log("Database " + dbname + " created successfully");
    });

    con.changeUser({database : dbname}, function(err) {
      if (err) throw err;
    });

    create_tables(dbname, servicios_enabled, comentarios_enabled, otras_enabled, function(err, result)  {
        if (err) throw err;
    });

    var arr_plantas = planta.split(",");
    var arr_generales = generales.split(",");
    
    let cv = 0;

    if (comentarios_enabled == 0) {
      cv = 1;
    }

    // MISSING CASE CHECK IF OTRAS OR SERVICIOS ARE EMPTY

    var sql_insert_empresa = "INSERT INTO empresa (id, nombre, year, escala, num_reactivos, num_generales, num_servicios, comentarios, num_otras) VALUES (" + empresa_id + ", '" + empresa + "', " + year + ", " + escala + ", " + num_reactivos + ", " + arr_generales.length + ", " + arr_servicios.length + ", " + cv + ", " + otras + ")";
    con.query(sql_insert_empresa, function (err, result) {
      if (err) throw err;
    });

    for (i = 0; i < arr_plantas.length; i++) {
      var sql_insert_plantas = "INSERT INTO plantas (planta) VALUES ('" + arr_plantas[i] + "')";
      con.query(sql_insert_plantas, function (err, result) {
        if (err) throw err;
      });
    }

    for (i = 0; i < arr_generales.length; i++) {
      var sql_insert_generales = "INSERT INTO generales (nombre) VALUES ('" + arr_generales[i] + "')";
      con.query(sql_insert_generales, function (err, result) {
        if (err) throw err;
      });
    }

    if (servicios_enabled == 0) {
      for (i = 0; i < arr_servicios.length; i++) {
        var sql_insert_servicios = "INSERT INTO servicios (servicio) VALUES ('" + arr_servicios[i] + "')";
        con.query(sql_insert_servicios, function (err, result) {
          if (err) throw err;
        });
      }
    }

    parse_reactivos(function(err, result)  { if (err) throw err; });

    parse_global(num_reactivos, escala, function(err, result)  { if (err) throw err; });
    
    parse_generales(arr_generales.length, arr_servicios.length, comentarios_enabled, otras, escala, function(err, result)  { if (err) throw err; });
    
    if (otras > 0) {
      parse_otras(function(err, result)  { if (err) throw err; });
    }

    let crumb = 'Nuevo Estudio';
    res.render('clima', {state, crumb});    
  }
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})