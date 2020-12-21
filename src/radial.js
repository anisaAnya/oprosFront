let instance = null;
//const radialCanvas = document.getElementById('radial_diagram').getContext('2d');

const labels = [
  ['Доступність', 'матеріалів'],
  ['Надання', 'питань до заліку'],
  ['Відповідність', 'практик лекціям'],
  ['Об\'єктівність'],
  ['Пyнктуальність'],
  ['Організація', 'лекційного часу'],
  ['Актуальність ', 'матеріалу'],
  'Коректність',
  ['Достатність', 'матеріалу']
];

const teachersFactory = (name, data) => ({
  label: name,
  backgroundColor: '#FE9000AA',
  borderColor: '#FFF0AD',
  data,
  pointRadius: '0',
  borderWidth: '3',
});

const datasets = [
  teachersFactory('Стешин В. В.', Array(9).fill(0).map(() => Math.random() * 4 + 1))
];


const marksData = { labels, datasets };

let chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scale: {
    angleLines: {
      display: true,
      color: '#FFF8D6',
      lineWidth: 2
    },
    gridLines: {
      display: true,
      color: '#FFF8D6',
      lineWidth: 2
    },
    ticks: {
      display: true,
      beginAtZero: true,
      min: 1,
      max: 5,
      stepSize: 1,
      fontSize: 24,
      fontColor: '#FFF8D6',
      backdropColor: '#2A3C2B',
    },
    pointLabels: {
      fontSize: 24,
      fontColor: '#FFF8D6'
    }
  },
  legend: {
    display: false,
  },
};

// new Chart(radialCanvas, {
//   type: 'radar',
//   data: marksData,
//   options: chartOptions
// });

//console.log(instance.data.datasets[0].data);

function radialDiagram(values = null) {
  if (!instance) {
    const radialCanvas = document.getElementById('radial_diagram').getContext('2d');
    instance = new Chart(radialCanvas, {
      type: 'radar',
      data: marksData,
      options: chartOptions
    });
  } else if (values) {
    instance.data.datasets[0].data = values;
    instance.update();
  }
}
