const express = require('express');;
const app = express();
const axios = require("axios");
var https = require('follow-redirects').https;
var fs = require('fs');
var cors = require('cors')
const bodyParser = require('body-parser');

app.use(cors())
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json({limit: '500kb'}));

app.post('/api/updatemodel', async function (req, res) {

  console.log(req.body)

  fs.writeFile('classifier.json', JSON.stringify(req.body), function (err) {
    if (err) throw err;
    console.log('Saved!');
  });

  res.end()

})

app.get('/api/getmodel', async function (req, res) {


  fs.readFile('classifier.json', function(err, data) {
    res.writeHead(200, {'Content-Type': 'text/application'});
    res.write(data);
    res.end();
  });

})


app.listen(3001);
console.log("Server running on port 3001");
