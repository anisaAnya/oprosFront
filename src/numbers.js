function gradient(firstColor, secondColor, coef) {
  const [r1, g1, b1] = firstColor;
  const [r2, g2, b2] = secondColor;
  const avg = [r1 + (r2 - r1) * coef, g1 + (g2 - g1) * coef, b1 + (b2 - b1) * coef];
  const max = Math.max(...avg);
  const normalize = 255 / max;
  return avg.map(val => val * normalize);
}

function updateNumbers(contract, rso, cheating, respondents, dist1, dist2) {
  const contractEl = document.getElementById('contract-percent');
  contractEl.innerHTML = contract + '%';

  const listeningEl = document.getElementById('cheating');
  listeningEl.innerHTML = cheating + '%';
  const listeningEl1 = document.getElementById('rso');
  listeningEl1.innerHTML = rso + '%';
  const listeningEl2 = document.getElementById('dist1');
  listeningEl2.innerHTML = dist1;
  const listeningEl3 = document.getElementById('dist2');
  listeningEl3.innerHTML = dist2;

  const respondentsEl = document.getElementById('respondents');
  respondentsEl.innerHTML = respondents;

  const colorContract = gradient([215, 38, 61], [46, 147, 60], contract / 100);
  const colorListening = gradient([215, 38, 61], [46, 147, 60], cheating / 100);
  const colorListening1 = gradient([215, 38, 61], [46, 147, 60], rso / 100);
  const colorListening2 = gradient([215, 38, 61], [46, 147, 60], dist1 / 6.5);
  const colorListening3 = gradient([215, 38, 61], [46, 147, 60], dist2 / 6.5);

  contractEl.style.color = `rgb(${colorContract[0]}, ${colorContract[1]}, ${colorContract[2]})`;
  listeningEl.style.color = `rgb(${colorListening[0]}, ${colorListening[1]}, ${colorListening[2]})`;
  listeningEl1.style.color = `rgb(${colorListening1[0]}, ${colorListening1[1]}, ${colorListening1[2]})`;

  listeningEl2.style.color = `rgb(${colorListening2[0]}, ${colorListening2[1]}, ${colorListening2[2]})`;
  listeningEl3.style.color = `rgb(${colorListening3[0]}, ${colorListening3[1]}, ${colorListening3[2]})`;

}
