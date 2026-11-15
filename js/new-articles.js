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
      // ジャンルがかぶらないように、ルアー・ロッド・アクセサリー・その他から2本ずつ（tools/make-new-articles.js と同じ選び方）
      var GENRES = ['ルアー', 'ロッド', 'アクセサリー', 'その他'];
      var pool = list.filter(function (x) { return x.file !== here; });
      var items = [];
      for (var i = 0; i < 2; i++) {
        GENRES.forEach(function (g) {
          var x = pool.filter(function (y) { return y.genre === g; })[i];
          if (x) items.push(x);
        });
      }
      pool.forEach(function (x) { if (items.length < 8 && items.indexOf(x) < 0) items.push(x); });
      items = items.slice(0, 8);
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
