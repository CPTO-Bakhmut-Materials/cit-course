(function () {
  function unicodeTrimmer(token) {
    if (token === null || token === undefined) return "";
    return String(token)
      .replace(/^[^\p{L}\p{N}_]+/u, "")
      .replace(/[^\p{L}\p{N}_]+$/u, "");
  }

  function unicodeSearch(idx, query, options) {
    if (!query || !idx || !idx.documentStore || !idx.documentStore.docs) return [];
    var terms = String(query).toLowerCase().match(/[\p{L}\p{N}_]+/gu);
    if (!terms || !terms.length) return [];

    var opts = options || {};
    var expand = opts.expand !== false;
    var isAnd = !opts.bool || opts.bool === "AND";
    var fields = opts.fields || { title: { boost: 2 }, breadcrumbs: { boost: 1 }, body: { boost: 1 } };
    var docs = idx.documentStore.docs;
    var results = [];

    var keys = Object.keys(docs);
    for (var i = 0; i < keys.length; i++) {
      var ref = keys[i];
      var doc = docs[ref];
      if (!doc) continue;

      var title = (doc.title || "").toLowerCase();
      var crumbs = (doc.breadcrumbs || "").toLowerCase();
      var body = (doc.body || "").toLowerCase();

      var matchedTerms = 0;
      var totalScore = 0;

      for (var t = 0; t < terms.length; t++) {
        var term = terms[t];
        var termScore = 0;

        if (fields.title && title.indexOf(term) !== -1) {
          termScore += (fields.title.boost || 2) * 3;
        }
        if (fields.breadcrumbs && crumbs.indexOf(term) !== -1) {
          termScore += (fields.breadcrumbs.boost || 1) * 1.5;
        }
        if (fields.body && body.indexOf(term) !== -1) {
          var count = 0;
          var pos = 0;
          while ((pos = body.indexOf(term, pos)) !== -1) {
            count++;
            pos += term.length;
            if (count >= 10) break;
          }
          termScore += (fields.body.boost || 1) * (1 + count * 0.2);
        }

        if (termScore > 0) {
          matchedTerms++;
          totalScore += termScore;
        }
      }

      if ((isAnd && matchedTerms === terms.length) || (!isAnd && matchedTerms > 0)) {
        results.push({ ref: ref, score: totalScore, doc: doc });
      }
    }

    results.sort(function (a, b) {
      return b.score - a.score;
    });
    return results;
  }

  function patchElasticlunr() {
    if (!window.elasticlunr) return false;
    window.elasticlunr.trimmer = unicodeTrimmer;
    if (window.elasticlunr.Pipeline && window.elasticlunr.Pipeline.registeredFunctions) {
      window.elasticlunr.Pipeline.registeredFunctions.trimmer = unicodeTrimmer;
    }
    if (
      window.elasticlunr.Index &&
      window.elasticlunr.Index.prototype &&
      !window.elasticlunr.Index.prototype.__ukSearchPatched
    ) {
      var origSearch = window.elasticlunr.Index.prototype.search;
      window.elasticlunr.Index.prototype.search = function (query, options) {
        if (query && /[^\x00-\x7F]/.test(query)) {
          return unicodeSearch(this, query, options);
        }
        var res = origSearch.call(this, query, options);
        if (!res || res.length === 0) {
          return unicodeSearch(this, query, options);
        }
        return res;
      };
      window.elasticlunr.Index.prototype.__ukSearchPatched = true;
    }
    return true;
  }

  if (!patchElasticlunr()) {
    window.addEventListener("DOMContentLoaded", patchElasticlunr);
    window.addEventListener("load", patchElasticlunr);
  }
})();
