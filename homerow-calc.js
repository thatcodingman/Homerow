(function () {
  var ids = ['cChars', 'cMin', 'cSec', 'cErr'];
  var el = {};
  ids.forEach(function (i) { el[i] = document.getElementById(i); });
  var out = document.getElementById('calcOut');
  if (!out) return;
  function num(i) { var v = parseFloat(el[i].value); return isFinite(v) && v > 0 ? v : 0; }
  function update() {
    var chars = num('cChars'), err = Math.min(num('cErr'), chars);
    var mins = num('cMin') + num('cSec') / 60;
    if (!chars || !mins) { out.textContent = 'Enter characters and a time to see your result.'; return; }
    var raw = chars / 5 / mins, net = (chars - err) / 5 / mins, acc = (chars - err) / chars * 100, cpm = chars / mins;
    out.innerHTML = '<strong>' + Math.round(net) + ' WPM</strong> net &middot; ' + Math.round(raw) + ' raw WPM &middot; ' +
      acc.toFixed(1) + '% accuracy &middot; ' + Math.round(cpm) + ' CPM';
  }
  ids.forEach(function (i) { el[i].addEventListener('input', update); });
})();
