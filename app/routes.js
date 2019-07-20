const express = require('express')
const app = express.Router()
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
function delete_user(user_id) {
  var sql_delete_user = "DELETE FROM `usuarios` WHERE `id` = " + user_id + ";";
  console.log(sql_delete_user)
  //con.query(sql_delete_user, function (err, result) {
  //  if (err) throw err;
  //});
}

function delete_company(company_id) {
  var sql_delete_company = "DELETE FROM `empresas` WHERE `id` = " + company_id + ";";
  con.query(sql_delete_company, function (err, result) {
    if (err) throw err;
  });
}

function delete_study(study_id) {
  var sql_delete_study = "DELETE FROM `clima` WHERE `id` = " + study_id + ";";
  con.query(sql_delete_study, function (err, result) {
    if (err) throw err;
  });
}

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

function query_builder(state, cond, generales_checks, segment_checks, data1, data2) {
  var query = "";

        if (state == 1) {
          query = "SELECT a1.rubro, AVG(a2.respuesta) AS avg_respuesta FROM reactivos AS a1 INNER JOIN global AS a2 ";
          for (j = 0; j < data2.length; j++) {
            if(generales_checks[j] == data2[j].id && generales_checks[j] != undefined) {
              query += " INNER JOIN (SELECT folio_id, respuesta AS general_id_" + (j+1) + " FROM generales_respuestas WHERE general_id = " + (j+1);

              for (k = 0; k < data1.length; k++) {
                for (q = 0; q < segment_checks.length; q++) {
                  if(segment_checks[q] == data1[k].respuesta && segment_checks[q] != undefined) {
                    if(data1[k].general_id == 1) {
                      query += " AND respuesta = " + data1[k].respuesta;
                      
                    } else {
                      query += " AND respuesta = '" + data1[k].respuesta + "'";
                      
                    }
                  }
                }
              }
              query += ") AS b" + (j+1) + " ON b" + (j+1) + ".folio_id = a2.folio_id";
              
            }
          }

          query += " WHERE a1.id = a2.reactivo_id GROUP BY rubro ORDER BY avg_respuesta DESC;";

        } else if (state == 2) {

          query = "SELECT a1.rubro, a1.factor, AVG(a2.respuesta) AS avg_respuesta FROM reactivos AS a1 INNER JOIN global AS a2 ";
          for (j = 0; j < data2.length; j++) {
            if(generales_checks[j] == data2[j].id && generales_checks[j] != undefined) {
              query += " INNER JOIN (SELECT folio_id, respuesta AS general_id_" + (j+1) + " FROM generales_respuestas WHERE general_id = " + (j+1);

              for (k = 0; k < data1.length; k++) {
                for (q = 0; q < segment_checks.length; q++) {
                  if(segment_checks[q] == data1[k].respuesta && segment_checks[q] != undefined) {
                    if(data1[k].general_id == 1) {
                      query += " AND respuesta = " + data1[k].respuesta;
                      
                    } else {
                      query += " AND respuesta = '" + data1[k].respuesta + "'";
                      
                    }
                  }
                }
              }
              query += ") AS b" + (j+1) + " ON b" + (j+1) + ".folio_id = a2.folio_id";
              
            }
          }

          query += " WHERE a1.id = a2.reactivo_id GROUP BY factor;";

        } else if (state == 3) {

          query = "SELECT a1.rubro, COUNT(a2.respuesta) AS ct_respuesta FROM reactivos as a1 INNER JOIN global AS a2 ";
          for (j = 0; j < data2.length; j++) {
            if(generales_checks[j] == data2[j].id && generales_checks[j] != undefined) {
              query += " INNER JOIN (SELECT folio_id, respuesta AS general_id_" + (j+1) + " FROM generales_respuestas WHERE general_id = " + (j+1);

              for (k = 0; k < data1.length; k++) {
                for (q = 0; q < segment_checks.length; q++) {
                  if(segment_checks[q] == data1[k].respuesta && segment_checks[q] != undefined) {
                    if(data1[k].general_id == 1) {
                      query += " AND respuesta = " + data1[k].respuesta;
                      
                    } else {
                      query += " AND respuesta = '" + data1[k].respuesta + "'";
                      
                    }
                  }
                }
              }
              query += ") AS b" + (j+1) + " ON b" + (j+1) + ".folio_id = a2.folio_id";
              
            }
          }

          if (cond == 1) {
            query += " WHERE a1.id = a2.reactivo_id AND respuesta = 100 GROUP BY rubro;";
          } else if (cond == 2) {
            query += " WHERE a1.id = a2.reactivo_id AND respuesta = 75 OR respuesta = 80 GROUP BY rubro;";
          } else if (cond == 3) {
            query += " WHERE a1.id = a2.reactivo_id AND respuesta = 25 OR respuesta = 40 GROUP BY rubro;";
          } else if (cond == 4) {
            query += " WHERE a1.id = a2.reactivo_id AND respuesta = 0 GROUP BY rubro;";
          }
 
        } else if (state == 4) {

          query = "SELECT a1.servicio, AVG(a2.respuesta) AS avg_respuesta FROM servicios as a1 INNER JOIN servicios_respuestas AS a2 ";
          for (j = 0; j < data2.length; j++) {
            if(generales_checks[j] == data2[j].id && generales_checks[j] != undefined) {
              query += " INNER JOIN (SELECT folio_id, respuesta AS general_id_" + (j+1) + " FROM generales_respuestas WHERE general_id = " + (j+1);

              for (k = 0; k < data1.length; k++) {
                for (q = 0; q < segment_checks.length; q++) {
                  if(segment_checks[q] == data1[k].respuesta && segment_checks[q] != undefined) {
                    if(data1[k].general_id == 1) {
                      query += " AND respuesta = " + data1[k].respuesta;
                      
                    } else {
                      query += " AND respuesta = '" + data1[k].respuesta + "'";
                      
                    }
                  }
                }
              }
              query += ") AS b" + (j+1) + " ON b" + (j+1) + ".folio_id = a2.folio_id";
              
            }
          }

          query += " WHERE a1.id = a2.servicio_id AND a2.respuesta >= 0 GROUP BY servicio;";
          
        } else if (state == 5 && cond != 4) {

          if (cond == 1) {
            query = "SELECT a1.id, a1.nombre, a2.respuesta, COUNT(a2.respuesta) AS hcount FROM generales AS a1 INNER JOIN generales_respuestas AS a2 ";
          } else if (cond == 2) {
            query = "SELECT a1.id, a1.nombre, a2.respuesta AS g_resp , AVG(a3.respuesta) AS avg_resp FROM generales AS a1 INNER JOIN generales_respuestas AS a2 INNER JOIN global AS a3 ";
          } else if (cond == 3) {
            query = "SELECT a4.rubro, a1.id, a1.nombre, a2.respuesta AS g_resp , AVG(a3.respuesta) AS avg_resp FROM generales AS a1 INNER JOIN generales_respuestas AS a2 INNER JOIN global AS a3 INNER JOIN reactivos AS a4 ";
          }

          for (j = 0; j < data2.length; j++) {
            if(generales_checks[j] == data2[j].id && generales_checks[j] != undefined) {
              query += " INNER JOIN (SELECT folio_id, respuesta AS general_id_" + (j+1) + " FROM generales_respuestas WHERE general_id = " + (j+1);

              for (k = 0; k < data1.length; k++) {
                for (q = 0; q < segment_checks.length; q++) {
                  if(segment_checks[q] == data1[k].respuesta && segment_checks[q] != undefined) {
                    if(data1[k].general_id == 1) {
                      query += " AND respuesta = " + data1[k].respuesta;
                      
                    } else {
                      query += " AND respuesta = '" + data1[k].respuesta + "'";
                      
                    }
                  }
                }
              }
              query += ") AS b" + (j+1) + " ON b" + (j+1) + ".folio_id = a2.folio_id";
              
            }
          }

          if (cond == 1) {
            query += " WHERE a1.id = a2.general_id GROUP BY id, respuesta;";
          } else if (cond == 2) {
            query += " WHERE a1.id = a2.general_id AND a2.folio_id = a3.folio_id GROUP BY id, g_resp;";
          } else if (cond == 3) {
            query += " WHERE a1.id = a2.general_id AND a2.folio_id = a3.folio_id AND a3.reactivo_id = a4.id GROUP BY rubro, id, g_resp;";
          }
          
        } else if (state == 5 && cond == 4) {
          query = "SELECT * FROM generales;";
        } else if (state == 6) {
          query = "SELECT a1.id, a1.rubro, a1.factor, a1.reactivo, AVG(a2.respuesta) AS avg_respuesta FROM reactivos AS a1 INNER JOIN global AS a2 ";
          for (j = 0; j < data2.length; j++) {
            if(generales_checks[j] == data2[j].id && generales_checks[j] != undefined) {
              query += " INNER JOIN (SELECT folio_id, respuesta AS general_id_" + (j+1) + " FROM generales_respuestas WHERE general_id = " + (j+1);

              for (k = 0; k < data1.length; k++) {
                for (q = 0; q < segment_checks.length; q++) {
                  if(segment_checks[q] == data1[k].respuesta && segment_checks[q] != undefined) {
                    if(data1[k].general_id == 1) {
                      query += " AND respuesta = " + data1[k].respuesta;
                      
                    } else {
                      query += " AND respuesta = '" + data1[k].respuesta + "'";
                      
                    }
                  }
                }
              }
              query += ") AS b" + (j+1) + " ON b" + (j+1) + ".folio_id = a2.folio_id";
              
            }
          }

          if (cond == 1) {
            query += " WHERE a1.id = a2.reactivo_id GROUP BY id ORDER BY avg_respuesta DESC;";
          } else if (cond == 2) {
            query += " WHERE a1.id = a2.reactivo_id GROUP BY id ORDER BY avg_respuesta DESC LIMIT 10;";
          } else if (cond == 3) {
            query += " WHERE a1.id = a2.reactivo_id GROUP BY id ORDER BY avg_respuesta ASC LIMIT 10;";
          } 

        } else if (state == 7) {
          query = "SELECT a1.folio_id, a1.comentario FROM comentarios AS a1 ";
          for (j = 0; j < data2.length; j++) {
            if(generales_checks[j] == data2[j].id && generales_checks[j] != undefined) {
              query += " INNER JOIN (SELECT folio_id, respuesta AS general_id_" + (j+1) + " FROM generales_respuestas WHERE general_id = " + (j+1);

              for (k = 0; k < data1.length; k++) {
                for (q = 0; q < segment_checks.length; q++) {
                  if(segment_checks[q] == data1[k].respuesta && segment_checks[q] != undefined) {
                    if(data1[k].general_id == 1) {
                      query += " AND respuesta = " + data1[k].respuesta;
                      
                    } else {
                      query += " AND respuesta = '" + data1[k].respuesta + "'";
                      
                    }
                  }
                }
              }
              query += ") AS b" + (j+1) + " ON b" + (j+1) + ".folio_id = a1.folio_id";
              
            }
          }

          query += " WHERE comentario <> '';";
          
        } else if (state == 8 && cond == 1) {
          query = "SELECT * FROM otras_preguntas;";
        } else if (state == 8 && cond == 2) {
          query = "SELECT a1.folio_id, a1.pregunta_id, a1.respuesta FROM otras_respuestas AS a1 ";
          for (j = 0; j < data2.length; j++) {
            if(generales_checks[j] == data2[j].id && generales_checks[j] != undefined) {
              query += " INNER JOIN (SELECT folio_id, respuesta AS general_id_" + (j+1) + " FROM generales_respuestas WHERE general_id = " + (j+1);

              for (k = 0; k < data1.length; k++) {
                for (q = 0; q < segment_checks.length; q++) {
                  if(segment_checks[q] == data1[k].respuesta && segment_checks[q] != undefined) {
                    if(data1[k].general_id == 1) {
                      query += " AND respuesta = " + data1[k].respuesta;
                      
                    } else {
                      query += " AND respuesta = '" + data1[k].respuesta + "'";
                      
                    }
                  }
                }
              }
              query += ") AS b" + (j+1) + " ON b" + (j+1) + ".folio_id = a1.folio_id";
              
            }
          }

          query += " WHERE respuesta <> '';";
        }

        //console.log(query);
        return query;
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
/*
app.get('/', function (req, res) {
  con.changeUser({database : "suitemp"}, function(err) {
      if (err) throw err;
    });
  res.render('index');
})
*/

app.get('/', function (req, res) {
  con.changeUser({database : "suitemp"}, function(err) {
      if (err) throw err;
    });
  res.render('login');
})

app.post('/', function (req, res) {
  state = parseInt(req.body.state);
  user = req.body.inputUser;
  pswd = req.body.inputPassword;

  let user_query = "SELECT username, password, empresa_id, type FROM `usuarios` WHERE username = '" + user + "';";
  con.query(user_query, function (err, result, fields) {
      if (err) throw err;
      let data = result;
      if (pswd != data[0].password) {
        state = 0;
      }
      if (state == 1) {
        console.log('Username: ' + user)
        type = data[0].type;
        comp = data[0].empresa_id;
        res.render('index', {user, type, comp});
      } else {
        res.render('login', {state});
      }
    });
})

app.get('/home', function (req, res) {
  con.changeUser({database : "suitemp"}, function(err) {
      if (err) throw err;
    });
  res.render('index', {user, type, comp});
})

app.get('/empresas', function (req, res) {
  con.query("SELECT * FROM empresas", function (err, result, fields) {
    if (err) throw err;
    let state = 0;
    let crumb = 'Empresas';
    let data = result;
    res.render('empresas', {state, crumb, data, user, type, comp});
  });
})

app.post('/empresas', upload.none(), function (req, res) {
  state = parseInt(req.body.state);
  if (state == 1) { 
    let crumb = 'Registrar Empresas';
    res.render('empresas', {state, crumb, user, type, comp});
  } else if (state == 2) {
    let nombre = req.body.nombre_input;
    let giro = req.body.giro_input;

    var sql_insert_empresa = "INSERT INTO empresas (nombre, giro) VALUES ('" + nombre + "', '" + giro + "')";
    con.query(sql_insert_empresa, function (err, result) {
      if (err) throw err;
    });

    let crumb = 'Registrar Empresas';
    res.render('empresas', {state, crumb, user, type, comp});
  } else if (state == 3) {
    company_id = parseInt(req.body.data_company_id);
    var sql_verify_company = "SELECT `empresas`.`id`, `usuarios`.`id` AS usuarios_id, `clima`.`id` AS clima_id FROM `empresas` LEFT JOIN `usuarios` ON `usuarios`.`empresa_id` = `empresas`.`id` LEFT JOIN `clima` ON `clima`.`empresa_id` = `empresas`.`id` WHERE `empresas`.`id` = " + company_id + " AND (usuarios.id IS NOT NULL OR clima.id IS NOT NULL);";
    con.query(sql_verify_company, function (err, result) {
      if (err) throw err;
      let crumb = 'Registrar Empresas';
      if(result[0] == undefined) {
        delete_company(company_id);
        res.render('empresas', {state, crumb, user, type, comp});
      } else {
        state = 4;
        res.render('empresas', {state, crumb, user, type, comp});
      }
    });
  }
})

app.get('/usuarios', function (req, res) {
  sql_usuarios = "SELECT `usuarios`.`id`, `username`, `password`, `creation_date`, `type`, `nombre` FROM `usuarios` INNER JOIN `empresas` ON `empresas`.`id` = `usuarios`.`empresa_id`";
  con.query(sql_usuarios, function (err, result, fields) {
    if (err) throw err;
    let state = 0;
    let crumb = 'Usuarios';
    let data = result;
    res.render('usuarios', {state, crumb, data, user, type, comp});
  });
})

app.post('/usuarios', upload.none(), function (req, res) {
  state = parseInt(req.body.state);
  if (state == 1) {
    con.query("SELECT * FROM empresas", function (err, result, fields) {
      if (err) throw err;
      let crumb = 'Registrar Usuarios';
      let data = result;
      res.render('usuarios', {state, crumb, data, user, type, comp});
    }); 
  } else if (state == 2) {
    let username = req.body.username_input;
    let password = req.body.password_input;
    let type = req.body.type_input;
    let empresa = req.body.select_empresa;

    var sql_insert_usuario = "INSERT INTO usuarios (username, password, empresa_id, type) VALUES ('" + username + "', '" + password + "', '" + empresa + "', '" + type + "')";
    con.query(sql_insert_usuario, function (err, result) {
      if (err) throw err;
    });

    let crumb = 'Registrar Usuarios';
    res.render('usuarios', {state, crumb, user, type, comp});
  } else if (state == 3) {
    user_id = parseInt(req.body.data_user_id);
    delete_user(user_id, function(err, result)  {
        if (err) throw err;
    });
    sql_usuarios = "SELECT `usuarios`.`id`, `username`, `password`, `creation_date`, `type`, `nombre` FROM `usuarios` INNER JOIN `empresas` ON `empresas`.`id` = `usuarios`.`empresa_id`";
    con.query(sql_usuarios, function (err, result, fields) {
      if (err) throw err;
      let state = 0;
      let crumb = 'Usuarios';
      let data = result;
      res.render('usuarios', {state, crumb, data, user, type, comp});
    });
  }
})

app.get('/editar_clima', function (req, res) {
  dbname = req.query.dbname;
  con.changeUser({database : dbname}, function(err) {
      if (err) throw err;
      console.log('Changed to DB ' + dbname)
  });
  let state = 0;
  let crumb = 'Editar Estudio';
  res.render('editar_clima', {state, crumb, user, type, comp});
})

app.post('/editar_clima', upload.array('reactivos_file'), function (req, res) {
  state = req.body.state;
  if (state == 1) {
    let crumb = 'Editar Estudio';
    res.render('editar_clima', {state, crumb, user, type, comp});
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
      res.render('editar_clima', {state, crumb, user, type, comp});
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
    res.render('clima', {state, crumb, data, user, type, comp});
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
      res.render('clima', {state, crumb, data, user, type, comp});
    });
  } else if (state == 1) {
    con.query("SELECT * FROM empresas", function (err, result, fields) {
      if (err) throw err;
      let state = 1;
      let crumb = 'Nuevo Estudio';
      let data = result;
      res.render('clima', {state, crumb, data, user, type, comp});
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
    res.render('clima', {state, crumb, user, type, comp});    
  } else if (state == 3) {
      study_id = parseInt(req.body.data_study_id);
      delete_study(study_id, function(err, result)  {
          if (err) throw err;
      });
      con.query("SELECT * FROM clima", function (err, result, fields) {
        if (err) throw err;
        let state = 0;
        let crumb = 'General';
        let data = result;
        res.render('clima', {state, crumb, data, user, type, comp});
      });
    }
})

/*
app.get('/clima_builder', function (req, res) {
  dbname = req.query.dbname;
  if (dbname != 'undefined') {
    con.changeUser({database : dbname}, function(err) {
      if (err) throw err;
      // console.log('Changed to DB ' + dbname)
    });
  }
  // Get
  var sql1 = "SELECT `general_id`, `nombre`, `respuesta`, `planta` FROM `generales_respuestas` INNER JOIN `generales` ON `generales_respuestas`.`general_id` = `generales`.`id` LEFT JOIN `plantas` ON `generales_respuestas`.`respuesta` = `plantas`.`id` GROUP BY `respuesta` ORDER BY `general_id`";
  var sql2 = "SELECT * FROM `generales`";
    con.query(sql1, function (err, res1, fields) {
      if (err) throw err;
      con.query(sql2, function (err, res2, fields) {
        if (err) throw err;
        let state = 0;
        let crumb = 'Query ' + dbname;
        data_gen = res1;
        data_seg = res2;
        res.render('clima_builder', {state, crumb, user, type, comp, data_gen, data_seg});
      });
    });
})
*/

app.get('/resultados_clima', function (req, res) {
  dbname = req.query.dbname;
  if (dbname != 'undefined') {
    con.changeUser({database : dbname}, function(err) {
      if (err) throw err;
      // console.log('Changed to DB ' + dbname)
    });
  }

  var sql1 = "SELECT `general_id`, `nombre`, `respuesta`, `planta` FROM `generales_respuestas` INNER JOIN `generales` ON `generales_respuestas`.`general_id` = `generales`.`id` LEFT JOIN `plantas` ON `generales_respuestas`.`respuesta` = `plantas`.`id` GROUP BY `respuesta` ORDER BY `general_id`";
  var sql2 = "SELECT * FROM `generales`";
    con.query(sql1, function (err, res1, fields) {
      if (err) throw err;
      con.query(sql2, function (err, res2, fields) {
        if (err) throw err;
        let state = 0;
        let crumb = 'Resultados ' + dbname;
        data_gen = res1;
        data_seg = res2;
        res.render('resultados_clima', {state, crumb, user, type, comp, data_gen, data_seg});
      });
    });
})

app.post('/resultados_clima', function (req, res) {
  state = req.body.state;
  dbname = req.body.dbname;
  global_check = parseInt(req.body.global_check);
  generales_length = parseInt(req.body.generales_length);
  segment_length = parseInt(req.body.segment_length);
  recalc = parseInt(req.body.recalc);
  var generales_checks = [];
  var temp_checks = [];
  var segment_checks = [];
  var empty_generals = true;

  for(i = 0; i < segment_length; i++){

    switch(i) {
      case 0:
        segment_checks[i] = req.body.segment_1;
        temp_checks[i] = parseInt(req.body.check_1);
        break;
      case 1:
        segment_checks[i] = req.body.segment_2;
        temp_checks[i] = parseInt(req.body.check_2);
        break;
      case 2:
        segment_checks[i] = req.body.segment_3;
        temp_checks[i] = parseInt(req.body.check_3);
        break;
      case 3:
        segment_checks[i] = req.body.segment_4;
        temp_checks[i] = parseInt(req.body.check_4);
        break;
      case 4:
        segment_checks[i] = req.body.segment_5
        temp_checks[i] = parseInt(req.body.check_5);
        break;
      case 5:
        segment_checks[i] = req.body.segment_6;
        temp_checks[i] = parseInt(req.body.check_6);
        break;
      case 6:
        segment_checks[i] = req.body.segment_7;
        temp_checks[i] = parseInt(req.body.check_7);
        break;
      case 7:
        segment_checks[i] = req.body.segment_8;
        temp_checks[i] = parseInt(req.body.check_8);
        break;
      case 8:
        segment_checks[i] = req.body.segment_9;
        temp_checks[i] = parseInt(req.body.check_9);
        break;
      case 9:
        segment_checks[i] = req.body.segment_10;
        temp_checks[i] = parseInt(req.body.check_10);
        break;
      case 10:
        segment_checks[i] = req.body.segment_11;
        temp_checks[i] = parseInt(req.body.check_11);
        break;
      case 11:
        segment_checks[i] = req.body.segment_12;
        temp_checks[i] = parseInt(req.body.check_12);
        break;
      case 12:
        segment_checks[i] = req.body.segment_13;
        temp_checks[i] = parseInt(req.body.check_13);
        break;
      case 13:
        segment_checks[i] = req.body.segment_14;
        temp_checks[i] = parseInt(req.body.check_14);
        break;
      case 14:
        segment_checks[i] = req.body.segment_15;
        temp_checks[i] = parseInt(req.body.check_15);
        break;
      case 15:
        segment_checks[i] = req.body.segment_16;
        temp_checks[i] = parseInt(req.body.check_16);
        break;
      case 16:
        segment_checks[i] = req.body.segment_17;
        temp_checks[i] = parseInt(req.body.check_17);
        break;
      case 17:
        segment_checks[i] = req.body.segment_18;
        temp_checks[i] = parseInt(req.body.check_18);
        break;
      case 18:
        segment_checks[i] = req.body.segment_19;
        temp_checks[i] = parseInt(req.body.check_19);
        break;
      case 19:
        segment_checks[i] = req.body.segment_20;
        temp_checks[i] = parseInt(req.body.check_20);
        break;
      case 20:
        segment_checks[i] = req.body.segment_21;
        temp_checks[i] = parseInt(req.body.check_21);
        break;
      case 21:
        segment_checks[i] = req.body.segment_22;
        temp_checks[i] = parseInt(req.body.check_22);
        break;
      case 22:
        segment_checks[i] = req.body.segment_23;
        temp_checks[i] = parseInt(req.body.check_23);
        break;
      case 23:
        segment_checks[i] = req.body.segment_24;
        temp_checks[i] = parseInt(req.body.check_24);
        break;
      case 24:
        segment_checks[i] = req.body.segment_25;
        temp_checks[i] = parseInt(req.body.check_25);
        break;
      case 25:
        segment_checks[i] = req.body.segment_26;
        temp_checks[i] = parseInt(req.body.check_26);
        break;
      case 26:
        segment_checks[i] = req.body.segment_27;
        temp_checks[i] = parseInt(req.body.check_27);
        break;
      case 27:
        segment_checks[i] = req.body.segment_28;
        temp_checks[i] = parseInt(req.body.check_28);
        break;
      case 28:
        segment_checks[i] = req.body.segment_29;
        temp_checks[i] = parseInt(req.body.check_29);
        break;
      case 29:
        segment_checks[i] = req.body.segment_30;
        temp_checks[i] = parseInt(req.body.check_30);
        break;
      default:
        segment_checks[i] = "";
    } 
  }

  for(i = 0; i < generales_length; i++){
    for(j = 0; j < segment_length; j++){
      if(segment_checks[j] != undefined && temp_checks[j] == i+1){
        generales_checks[i] = temp_checks[j];
      }
    }
    if(generales_checks[i] == i+1) {
      empty_generals = false;
    } else {
      generales_checks[i] = undefined;
    }
  }
  
  var mainq1 = "SELECT `general_id`, `nombre`, `respuesta`, `planta` FROM `generales_respuestas` INNER JOIN `generales` ON `generales_respuestas`.`general_id` = `generales`.`id` LEFT JOIN `plantas` ON `generales_respuestas`.`respuesta` = `plantas`.`id` GROUP BY `respuesta` ORDER BY `general_id`";
  var mainq2 = "SELECT * FROM `generales`";

  con.query(mainq1, function (err, maind1, fields) {
    if (err) throw err;
    con.query(mainq2, function (err, maind2, fields) {
      if (err) throw err;

      if (state == 0) {
    let crumb = 'Resultados ' + dbname;

    //console.log(generales_checks);
    //console.log(segment_checks);
    //console.log(temp_checks);

    res.render('resultados_clima', {state, crumb, user, type, comp, data_gen, data_seg});
  } else if (state == 1) {

    sql = query_builder(state, 0, generales_checks, segment_checks, maind1, maind2);

    con.query(sql, function (err, result, fields) {
      if (err) throw err;
      let data = result;
      let crumb = 'Resultados ' + dbname;
      res.render('resultados_clima', {state, crumb, data, user, type, comp, data_gen, data_seg});
    });
  } else if (state == 2) {

    sql = query_builder(state, 0, generales_checks, segment_checks, maind1, maind2);

    con.query(sql, function (err, result, fields) {
      if (err) throw err;
      let data = result;
      let crumb = 'Resultados ' + dbname;
      res.render('resultados_clima', {state, crumb, data, user, type, comp, data_gen, data_seg});
    });
  } else if (state == 3) {

    var sql1 = query_builder(state, 1, generales_checks, segment_checks, maind1, maind2);
    var sql2 = query_builder(state, 2, generales_checks, segment_checks, maind1, maind2);
    var sql3 = query_builder(state, 3, generales_checks, segment_checks, maind1, maind2);
    var sql4 = query_builder(state, 4, generales_checks, segment_checks, maind1, maind2);

    con.query(sql1, function (err, data1, fields) {
      if (err) throw err;
      con.query(sql2, function (err, data2, fields) {
        if (err) throw err;
        con.query(sql3, function (err, data3, fields) {
          if (err) throw err;
          con.query(sql4, function (err, data4, fields) {
            if (err) throw err;
            let crumb = 'Resultados ' + dbname;
            res.render('resultados_prop', {state, crumb, data1, data2, data3, data4, user, type, comp, data_gen, data_seg});     
          });
        });
      });
    });
  } else if (state == 4) {

    sql = query_builder(state, 0, generales_checks, segment_checks, maind1, maind2);

    con.query(sql, function (err, result, fields) {
      if (err) throw err;
      let data = result;
      let crumb = 'Resultados ' + dbname;
      res.render('resultados_clima', {state, crumb, data, user, type, comp, data_gen, data_seg});
    });
  } else if (state == 5) {

    var sql1 = query_builder(state, 1, generales_checks, segment_checks, maind1, maind2);
    var sql2 = query_builder(state, 2, generales_checks, segment_checks, maind1, maind2);
    var sql3 = query_builder(state, 3, generales_checks, segment_checks, maind1, maind2);
    var sql4 = query_builder(state, 4, generales_checks, segment_checks, maind1, maind2);

    con.query(sql1, function (err, data1, fields) {
      if (err) throw err;
      con.query(sql2, function (err, data2, fields) {
        if (err) throw err;
        con.query(sql3, function (err, data3, fields) {
          if (err) throw err;
          con.query(sql4, function (err, data4, fields) {
            if (err) throw err;
            let crumb = 'Resultados ' + dbname;
            res.render('resultados_clima', {state, crumb, data1, data2, data3, data4, user, type, comp, data_gen, data_seg});     
          });
        });
      });
    });
  } else if (state == 6) {

    var sql1 = query_builder(state, 1, generales_checks, segment_checks, maind1, maind2);
    var sql2 = query_builder(state, 2, generales_checks, segment_checks, maind1, maind2);
    var sql3 = query_builder(state, 3, generales_checks, segment_checks, maind1, maind2);

    con.query(sql1, function (err, data1, fields) {
      if (err) throw err;
      con.query(sql2, function (err, data2, fields) {
        if (err) throw err;
        con.query(sql3, function (err, data3, fields) {
          if (err) throw err;
          let crumb = 'Resultados ' + dbname;
          res.render('resultados_clima', {state, crumb, data1, data2, data3, user, type, comp, data_gen, data_seg});
        });
      });
    });
  } else if (state == 7) {

    var sql = query_builder(state, 0, generales_checks, segment_checks, maind1, maind2);
    //console.log(sql);
    con.query(sql, function (err, result, fields) {
      if (err) throw err;
      let data = result;
      let crumb = 'Resultados ' + dbname;
      res.render('resultados_clima', {state, crumb, data, user, type, comp, data_gen, data_seg});
    });
  } else if (state == 8) {

    var sql1 = query_builder(state, 1, generales_checks, segment_checks, maind1, maind2);
    var sql2 = query_builder(state, 2, generales_checks, segment_checks, maind1, maind2);
    
    con.query(sql1, function (err, data1, fields) {
      if (err) throw err;
      con.query(sql2, function (err, data2, fields) {
        if (err) throw err;
        let crumb = 'Resultados ' + dbname;
        res.render('resultados_clima', {state, crumb, data1, data2, user, type, comp, data_gen, data_seg});
      });
    });
  }

    });
  });

})


module.exports = app