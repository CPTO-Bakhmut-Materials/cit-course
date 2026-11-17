(function () {
  var katexVersion = "0.16.11";
  var base = "https://cdn.jsdelivr.net/npm/katex@" + katexVersion + "/dist/";

  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = base + "katex.min.css";
  document.head.appendChild(link);

  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src;
    s.defer = true;
    s.onload = cb;
    document.head.appendChild(s);
  }

  loadScript(base + "katex.min.js", function () {
    loadScript(base + "contrib/auto-render.min.js", function () {
      var target = document.querySelector("main") || document.body;
      if (window.renderMathInElement) {
        window.renderMathInElement(target, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true }
          ],
          throwOnError: false
        });
      }
    });
  });
})();
