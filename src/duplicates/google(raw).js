'use strict';

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const Correlation = require('node-correlation');
const FormulaParser = require('hot-formula-parser').Parser;
let parser = new FormulaParser();

const avg = (acc, val, ind, arr) => (acc + val / arr.length);

const dispersion = obj => {
  const entries = Object.entries(obj);
  let arr = [];
  entries.forEach(([key, value]) => arr = arr.concat(new Array(value).fill(key)));
  const average = arr.reduce(avg, 0);
  const disp = (acc, val, ind, arr) => (acc + Math.pow((average - val), 2) / arr.length);
  return arr.reduce(disp, 0);
};

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, idPrepod, idPrepodsData, response) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client, idPrepod, idPrepodsData, response);
  });
}

function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}



function listMajors(auth, idPrepod, idPrepodsData, response) {
  const result = {
    name: '',
    picURL: '',
    totalStudents: 0,
    опитаних: 0,
    курс: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0
    },
    доступність_матеріалів: [],
    перелік_питань: [],
    відповідність_завдань: [],
    РСО: [],
    перенесення: [],
    організація_часу: [],
    викладача_чути: [],
    змістовна_якість: [],
    вимогливість: [],
    коректність: [],
    списування: [],
    інформування: [],
    задоволення: [],
    задоволення_відповіді: {
      4: 0,
      3: 0,
      2: 0,
      1: 0,
      0: 0
    },
    самооцінка: [],
    самооцінка_відповіді: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    },
    оцінка_заліковка: [],
    подовження_контракту: [],
    CORR_оцінка_самооцінка: 0,
    confidenceInt: 0
  };

  const sheets = google.sheets({version: 'v4', auth});
  let counter = 0;

  sheets.spreadsheets.get({
    spreadsheetId: idPrepod
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const regExp = /.+(?= \(Ответы)/;
    //result.name = res.data.properties.title.match(regExp)[0];
    //console.log(result.name);

    sheets.spreadsheets.values.get({
      spreadsheetId: idPrepodsData,
      range: 'Лист1!A1:D'
    }, (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      const rows = res.data.values;
      if (rows.length) {
        rows.forEach(row => {
          //console.log(row[0]);
          if (row[0] === result.name) {
            result.picURL = row[2];
            const regExp = /(?<=\/)[0-9]+/;
            result.totalStudents = parseInt(row[3].match(regExp));
          }
        });
      }
      const total = result.totalStudents;
      const responses = result.опитаних;
      const disp = dispersion(result.задоволення_відповіді);
      console.log(responses, total, disp);
      const stError = parser.parse(`T.INV(0.975, ${responses - 1})`).result;
      const confidenceInt = stError * Math.sqrt(disp) / Math.sqrt(responses) * Math.sqrt(1 - responses / total);

      result.confidenceInt = confidenceInt;

      counter++;
      if (counter == 2) {
        const json = JSON.stringify(result);
        response.write(json);
        response.end();
      }
    });
  });

  sheets.spreadsheets.values.get({
    spreadsheetId: idPrepod,
    range: 'Ответы на форму (1)!C2:T',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    if (rows.length) {
      rows.forEach(row => {
        if (row[0]) {
          result.опитаних++;
          result.курс[+row[0]]++;
          result.доступність_матеріалів.push(+row[1] - 1);
          result.перелік_питань.push(+row[2] - 1);
          result.відповідність_завдань.push(+row[3] - 1);
          result.РСО.push(+row[4] - 1);
          result.перенесення.push(+row[6] - 1);
          result.організація_часу.push(+row[7] - 1);
          result.викладача_чути.push(row[8] === 'Так' ? 100 : 0);
          result.змістовна_якість.push(+row[9] - 1);
          result.вимогливість.push(+row[10] - 1);
          result.коректність.push(+row[11] - 1);
          result.списування.push(row[12] === 'Так' ? 100 : 0);
          result.інформування.push(+row[13] - 1);
          result.задоволення.push(+row[14] - 1);
          result.задоволення_відповіді[+row[14] - 1]++;
          result.самооцінка.push(+row[15]);
          result.самооцінка_відповіді[+row[15]]++;
          result.оцінка_заліковка.push(row[16] === 'А' ? 5 :
                                       row[16] === 'B' ? 4 :
                                       row[16] === 'C' ? 3 :
                                       row[16] === 'D' ? 2 :
                                       row[16] === 'E' ? 1 : undefined);
          result.подовження_контракту.push(row[17] === 'Так' ? 100 : 0);
        }
      });

      result.CORR_оцінка_самооцінка = Correlation.calc(result.оцінка_заліковка, result.самооцінка);
      result.доступність_матеріалів = result.доступність_матеріалів.reduce(avg, 0);
      result.перелік_питань = result.перелік_питань.reduce(avg, 0);
      result.відповідність_завдань = result.відповідність_завдань.reduce(avg, 0);
      result.РСО = result.РСО.reduce(avg, 0);
      result.перенесення = result.перенесення.reduce(avg, 0);
      result.організація_часу = result.організація_часу.reduce(avg, 0);
      result.викладача_чути = result.викладача_чути.reduce(avg, 0);
      result.змістовна_якість = result.змістовна_якість.reduce(avg, 0);
      result.вимогливість = result.вимогливість.reduce(avg, 0);
      result.коректність = result.коректність.reduce(avg, 0);
      result.списування = result.списування.reduce(avg, 0);
      result.інформування = result.інформування.reduce(avg, 0);
      result.задоволення = result.задоволення.reduce(avg, 0);
      result.самооцінка = result.самооцінка.reduce(avg, 0);
      result.оцінка_заліковка = result.оцінка_заліковка.reduce(avg, 0);
      result.подовження_контракту = result.подовження_контракту.reduce(avg, 0);
      // console.log([confidenceInt, responses, result.CORR_оцінка_самооцінка]);
      counter++;
      if (counter == 2) {
        const json = JSON.stringify(result);
        response.write(json);
        response.end();
      }
    } else {
      console.log('No data found.');
    }
  });
}

const getJSON = (url, response) => {
  const regExp = /[^/]+/g;
  const [idPrepod, idPrepodsData] = url.match(regExp);
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), listMajors, idPrepod, idPrepodsData, response);
  });
};

module.exports = getJSON;






'use strict';

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const Correlation = require('node-correlation');
const FormulaParser = require('hot-formula-parser').Parser;
let parser = new FormulaParser();

const avg = (acc, val, ind, arr) => (acc + val / arr.length);

const dispersion = obj => {
  const entries = Object.entries(obj);
  let arr = [];
  entries.forEach(([key, value]) => arr = arr.concat(new Array(value).fill(key)));
  const average = arr.reduce(avg, 0);
  const disp = (acc, val, ind, arr) => (acc + Math.pow((average - val), 2) / arr.length);
  return arr.reduce(disp, 0);
};

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, idPrepod, idPrepodsData, response) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client, idPrepod, idPrepodsData, response);
  });
}

function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

let float_1_5 = [
  'Доступність навчальних матеріалів для засвоєння теорії',
  'Наявність переліку теоретичних питань, що будуть на заліку\\екзамені',
  'Відповідність лабораторних та практичних завдань пройденому матеріалу',
  'Наявність РСО ',
  'Перенесення занять та запізнення викладача',
  'Організація часу на лекції',
  'Змістовна якість викладеного матеріалу',
  'Вимогливість викладача ',
  'Коректність викладача',
  'Своєчасність та достатність інформування ',
  'Ваша оцінка в заліковій з предмету']

let yes_no = [
  'Викладача чути, викладач говорить розбірливо та зрозуміло',
  'Викладач навмисно дає змогу списувати заліки, контрольні\\ігнорує списування',
  'Чи варто, на вашу думку, подовжувати контракт цьому викладачу']

let dists = [
  'Як ви оцінюєте свій рівень після вивчення дисципліни',
  'Чи задовольнила вас якість викладання дисципліни '
]


function listMajors(auth, idPrepod, idPrepodsData, response) {
  const result = {
    name: '',
    picURL: '',
    totalStudents: 0,
    опитаних: 0,
    курс: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0
    },
    доступність_матеріалів: [],
    перелік_питань: [],
    відповідність_завдань: [],
    РСО: [],
    перенесення: [],
    організація_часу: [],
    викладача_чути: [],
    змістовна_якість: [],
    вимогливість: [],
    коректність: [],
    списування: [],
    інформування: [],
    задоволення: [],
    задоволення_відповіді: {
      4: 0,
      3: 0,
      2: 0,
      1: 0,
      0: 0
    },
    самооцінка: [],
    самооцінка_відповіді: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    },
    оцінка_заліковка: [],
    подовження_контракту: [],
    CORR_оцінка_самооцінка: 0,
    confidenceInt: 0
  };

  const sheets = google.sheets({version: 'v4', auth});
  let counter = 0;

  sheets.spreadsheets.get({
    spreadsheetId: idPrepod
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const regExp = /.+(?= \(Ответы)/;
    result.name = res.data.properties.title.match(regExp)[0];
    console.log(result.name);
  });

  sheets.spreadsheets.values.get({
    spreadsheetId: idPrepod,
    range: 'Ответы на форму (1)!D1:T',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    let result = {}
    let keys = res.data.values[0]
    for (let i = 0; i < keys.length; i++) {
      for (let c = 1; c < res.data.values.length; c++) {
        if (result[keys[i]]) result[keys[i]].push(res.data.values[c][i])
          else result[keys[i]] = [res.data.values[c][i]]
      }
    }
    console.log(result)
    if (rows.length) {
      rows.forEach(row => {
        if (row[0]) {
          result.опитаних++;
          result.курс[+row[0]]++;
          result.доступність_матеріалів.push(+row[1] - 1);
          result.перелік_питань.push(+row[2] - 1);
          result.відповідність_завдань.push(+row[3] - 1);
          result.РСО.push(+row[4] - 1);
          result.перенесення.push(+row[6] - 1);
          result.організація_часу.push(+row[7] - 1);
          result.викладача_чути.push(row[8] === 'Так' ? 100 : 0);
          result.змістовна_якість.push(+row[9] - 1);
          result.вимогливість.push(+row[10] - 1);
          result.коректність.push(+row[11] - 1);
          result.списування.push(row[12] === 'Так' ? 100 : 0);
          result.інформування.push(+row[13] - 1);
          result.задоволення.push(+row[14] - 1);
          result.задоволення_відповіді[+row[14] - 1]++;
          result.самооцінка.push(+row[15]);
          result.самооцінка_відповіді[+row[15]]++;
          result.оцінка_заліковка.push(row[16] === 'А' ? 5 :
                                       row[16] === 'B' ? 4 :
                                       row[16] === 'C' ? 3 :
                                       row[16] === 'D' ? 2 :
                                       row[16] === 'E' ? 1 : undefined);
          result.подовження_контракту.push(row[17] === 'Так' ? 100 : 0);
        }
      });

      result.CORR_оцінка_самооцінка = Correlation.calc(result.оцінка_заліковка, result.самооцінка);
      result.доступність_матеріалів = result.доступність_матеріалів.reduce(avg, 0);
      result.перелік_питань = result.перелік_питань.reduce(avg, 0);
      result.відповідність_завдань = result.відповідність_завдань.reduce(avg, 0);
      result.РСО = result.РСО.reduce(avg, 0);
      result.перенесення = result.перенесення.reduce(avg, 0);
      result.організація_часу = result.організація_часу.reduce(avg, 0);
      result.викладача_чути = result.викладача_чути.reduce(avg, 0);
      result.змістовна_якість = result.змістовна_якість.reduce(avg, 0);
      result.вимогливість = result.вимогливість.reduce(avg, 0);
      result.коректність = result.коректність.reduce(avg, 0);
      result.списування = result.списування.reduce(avg, 0);
      result.інформування = result.інформування.reduce(avg, 0);
      result.задоволення = result.задоволення.reduce(avg, 0);
      result.самооцінка = result.самооцінка.reduce(avg, 0);
      result.оцінка_заліковка = result.оцінка_заліковка.reduce(avg, 0);
      result.подовження_контракту = result.подовження_контракту.reduce(avg, 0);
      // console.log([confidenceInt, responses, result.CORR_оцінка_самооцінка]);
      counter++;
      if (counter == 2) {
        const json = JSON.stringify(result);
        response.write(json);
        response.end();
      }
    } else {
      console.log('No data found.');
    }
    for (key in float_1_5) result[key] = result[key].reduce(avg, 0);
    for (key in yes_no) result[key] = result[key].forEach(x => {(x == 'Так') ? 100 : 0}).reduce(avg, 0);
    for (key in dists){
      res = {
        4: 0,
        3: 0,
        2: 0,
        1: 0,
        0: 0
      }
      result[key].forEach(x => {res[x] += 1})
    }
    console.log(result)
    const json = JSON.stringify(result);
    response.write(json);
    response.end();
  });
}

const getJSON = (url, response) => {
  const regExp = /[^/]+/g;
  const [idPrepod, idPrepodsData] = url.match(regExp);
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), listMajors, idPrepod, idPrepodsData, response);
  });
};

module.exports = getJSON;
