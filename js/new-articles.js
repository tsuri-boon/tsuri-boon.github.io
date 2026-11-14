// 記事ページの「新着記事はこちら」を表示する。
// 一覧は tools/make-new-articles.js が作る data/new-articles.json から読む（記事のHTMLは書き換えない）。
(function () {
  var box = document.getElementById('shinchaku');
  if (!box || !window.fetch) return;
  var here = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  var esc = function (s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  };
  fetch('../data/new-articles.json')
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (list) {
      var items = list.filter(function (x) { return x.file !== here; }).slice(0, 8);
      if (!items.length) return;
      box.querySelector('.osusume-cards').innerHTML = items.map(function (x) {
        return '<a href="' + esc(x.file) + '.html" class="osusume-card">'
          + '<span class="osusume-thumb"><img src="../image/' + esc(x.img) + '" alt="' + esc(x.name) + '" loading="lazy"></span>'
          + '<span class="osusume-name">' + esc(x.name) + '</span>'
          + '<span class="osusume-copy">' + esc(x.copy) + '</span>'
          + '</a>';
      }).join('');
      box.hidden = false;
    })
    .catch(function () {});
})();
