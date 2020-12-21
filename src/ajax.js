function ajax() {
  // javascript-код голосования из примера
  // (1) создать объект для запроса к серверу
  var req = new XMLHttpRequest();

  // (2)
  // span рядом с кнопкой
  // в нем будем отображать ход выполнения
//  var statusElem = document.getElementById('vote_status');

  req.onreadystatechange = function() {
    // onreadystatechange активируется при получении ответа сервера
    if (req.readyState == 4) {
      if(req.status == 200) {
        // если статус 200 (ОК) - выдать ответ пользователю
        const json = JSON.parse(req.responseText);
      //  console.log("hiiiiiii", json)

        const educationValues = [];
        Object.entries(json["Чи задовольнила вас якість викладання дисципліни "]).forEach(([key, val]) => {
          educationValues[parseInt(key) - 1] = val;
        });
        linearDiagram(('education_rate'), educationValues);

        const knowledgeValues = [];
        Object.entries(json["Як ви оцінюєте свій рівень після вивчення дисципліни"]).forEach(([key, val]) => {
          knowledgeValues[parseInt(key) - 1] = val;
        });
        linearDiagram(('knowledge_rate'), knowledgeValues);

        const radialData = json['radial'].map(x => json[x]);

        radialDiagram(radialData);
        console.log('ffff', updateNumbers)
        updateNumbers(Math.round(json["Чи варто, на вашу думку, подовжувати контракт цьому викладачу"] * 10) / 10,
          Math.round(json['Наявність РСО'] * 10) / 10,
          Math.round(json['Викладач систематично дозволяє здати на гарну оцінку завдання/лаб. роботи/екзамен студентам, які погано володіють матеріалом'] * 10) / 10,
          json['Всього опитано'],
          json['Проведення лекцій на дистанційному навчанні'].toFixed(1),
          json["Підтримка зв'язку зі студентами на дистанційному навчанні"].toFixed(1)
        );

        updatePrepod(json.name, json.picURL);

        // alert('Ответ сервера: '+req.responseText);
      }
      // тут можно добавить else с обработкой ошибок запроса
    }

  };
  const URL = document.getElementById('table-URL').value + document.getElementById('table-prepods-URL').value;
  // (3) задать адрес подключения
  const regExp = /(?<=https:\/\/docs\.google\.com\/spreadsheets\/d\/)[^/]+/g;
  const [idPrepod, idPrepodsData] = URL.match(regExp);

  req.open('GET', '/ajax/' + idPrepod + '/' + idPrepodsData, true);

  // объект запроса подготовлен: указан адрес и создана функция onreadystatechange
  // для обработки ответа сервера

  // (4)
  req.send(null);  // отослать запрос

  // (5)


}
