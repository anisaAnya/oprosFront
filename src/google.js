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

let radial = [
  'Відповідність лабораторних та практичних завдань пройденому матеріалу',
  "Об'єктивність оцінювання",
  'Пунктуальність',
  'Організація часу на лекції',
  'Актуальність матеріалу',
  'Коректність викладача',
  'Своєчасність та достатність інформування '
]
let dist_quest = ['Проведення лекцій на дистанційному навчанні',
"Підтримка зв'язку зі студентами на дистанційному навчанні",]

let yes_no = [
  'Наявність РСО',
  'Викладач систематично дозволяє здати на гарну оцінку завдання/лаб. роботи/екзамен студентам, які погано володіють матеріалом',
  'Чи варто, на вашу думку, подовжувати контракт цьому викладачу']

let distributions = [
  'Як ви оцінюєте свій рівень після вивчення дисципліни',
  'Чи задовольнила вас якість викладання дисципліни '
]

function listMajors(auth, idPrepod, idPrepodsData, response) {
  let result = {}
  const sheets = google.sheets({version: 'v4', auth});
  let counter = 0;

  sheets.spreadsheets.get({
    spreadsheetId: idPrepod
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const regExp = /.+(?= \(Лек)/;
    result['name'] = res.data.properties.title.substr(0,15);
    console.log(result.name);
  });

  sheets.spreadsheets.values.get({
    spreadsheetId: idPrepod,
    range: 'Ответы на форму (1)!D1:T',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    let keys = res.data.values[0]
    console.log('ключи в данных: ',keys)
    for (let i = 0; i < keys.length; i++) {
      for (let c = 1; c < res.data.values.length; c++) {
        if (result[keys[i]]) result[keys[i]].push(res.data.values[c][i])
          else result[keys[i]] = [res.data.values[c][i]]
      }
    }
    result['Всього опитано'] = res.data.values.length - 1
    for (let key of radial) result[key] = result[key].reduce(avg, 0);
    for (let key of dist_quest) result[key] = result[key].reduce(avg, 0);
    let correct_answer_for_rso = 'РСО була оприлюднена у перші два тижні навчання'
    for (let key of yes_no) result[key] = result[key].map(x => {return (x == correct_answer_for_rso || x == 'Так') ? 100 : 0}).reduce(avg, 0);
    for (let key of distributions){
      res = {
        4: 0,
        3: 0,
        2: 0,
        1: 0,
        5: 0
      }
      result[key].forEach(x => {res[x] += 1})
      result[key] = res
    }
    result['radial'] = radial
    result['yes_no'] = yes_no
    result['dist_quest'] = dist_quest
    result['distributions'] = distributions
    delete result['Ваша оцінка в заліковій з предмету']
    delete result['Вільний мікрофон']
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
    authorize(JSON.parse(content), listMajors, idPrepod, idPrepodsData, response);
  });
};

module.exports = getJSON;
