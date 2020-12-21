'use strict';

const fs = require('fs');
const getJSON = require('./src/google');
const html = fs.readFileSync('./index.html', 'utf-8');
const linearJs = fs.readFileSync('./src/linear.js', 'utf-8');
const radialJs = fs.readFileSync('./src/radial.js', 'utf-8');
const prepodJs = fs.readFileSync('./src/prepod.js', 'utf-8');
const numbersJs = fs.readFileSync('./src/numbers.js', 'utf-8');
const stylesCss = fs.readFileSync('./src/styles.css', 'utf-8');
const resetCss = fs.readFileSync('./src/reset.css', 'utf-8');
const chartJs = fs.readFileSync('./node_modules/chart.js/dist/Chart.min.js', 'utf-8');
const ajaxJs = fs.readFileSync('./src/ajax.js', 'utf-8');


const http = require('http');
const port = 3000;

const requestHandler = (request, response) => {
  console.log(request.url);
  if (request.url.slice(0, 5) == '/ajax') {
    const URLs = request.url.slice(6);
    //console.log(URLs);
    getJSON(URLs, response);
  } else {
    switch (request.url) {
    case '/favicon.ico':
      response.write(html);
      break;
    case '/src/reset.css':
      response.write(resetCss);
      break;
    case '/src/styles.css':
      response.write(stylesCss);
      break;
    case '/node_modules/chart.js/dist/Chart.min.js':
      response.write(chartJs);
      break;
    case '/src/radial.js':
      response.write(radialJs);
      break;
    case '/src/linear.js':
      response.write(linearJs);
      break;
    case '/src/numbers.js':
      response.write(numbersJs);
      break;
    case '/src/prepod.js':
      response.write(prepodJs);
      break;
    case '/src/ajax.js':
      response.write(ajaxJs);
      break;
    default:
      response.writeHeader(200, {'Content-Type': 'text/html'});
      response.write(html);
    }
    response.end();
  }
};

const server = http.createServer(requestHandler);
server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  }
  console.log(`server is listening on ${port}`);
});

