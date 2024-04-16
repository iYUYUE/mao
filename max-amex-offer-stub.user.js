// ==UserScript==
// @name       max-amex-offer-neat
// @namespace  mao
// @version    0.4.9
// @author     1dy
// @license    CC BY-NC-ND 4.0
// @icon       https://asset-cdn.uscardforum.com/original/3X/6/f/6fa25c11ba251570095c4d2d2a6e16bb009df642.png
// @match      *://*.americanexpress.com/*
// @grant      GM.xmlHttpRequest
// @grant      GM.addElement
// @grant      GM.notification
// @grant      GM.openInTab
// @grant      GM.deleteValue
// @grant      GM.getValue
// @grant      GM.listValues
// @grant      GM.setValue
// @grant      GM_cookie
// @grant      unsafeWindow
// @connect    githubusercontent.com
// @connect    jsdelivr.net
// @connect    uscardforum.com
// @connect    cloudfunctions.net
// @connect    yale.email
// @downloadURL https://update.greasyfork.org/scripts/463121/max-amex-offer.user.js
// @updateURL https://update.greasyfork.org/scripts/463121/max-amex-offer.meta.js
// ==/UserScript==

// TODO: Prevent tool spread to outside of the forum
(function () {
  // https://anseki.github.io/gnirts/
  // https://skalman.github.io/UglifyJS-online/
  function parseRequiredLibraries(scriptContent) {
    const requireRegex = /\/\/ @require\s+(https?:\/\/\S+)/g;
    let match;
    let libs = [];

    while ((match = requireRegex.exec(scriptContent)) !== null) {
      libs.push(match[1]);
    }

    return libs;
  }

  function addLib(url) {
    return new Promise((resolve, reject) => {
      let script = GM.addElement(document.head, "script", {
        src: url,
        type: "text/javascript",
      });
      script.onload = resolve;
      script.onerror = reject;
    });
  }

  function safeEval(content) {
    if (GM && GM.addElement && typeof GM.addElement === "function") {
      // Use addElement to avoid CSP, for instance, in TamperMonkey
      GM.addElement(document.head, "script", {
        textContent: content,
        type: "text/javascript",
      });
    } else {
      // Fallback to eval, for instance, in GreaseMonkey
      eval(content);
    }
  }

  function addLib2(url) {
    return new Promise((resolve, reject) => {
      GM.xmlHttpRequest({
        method: "GET",
        url: url,
        onload: async function (response) {
          if (response.status >= 200 && response.status < 300) {
            try {
              safeEval(response.responseText);
              resolve(response);
            } catch (error) {
              reject(error);
            }
          } else {
            reject({
              msg: "Error fetching lib",
              response,
            });
          }
        },
        onerror: reject,
      });
    });
  }

  const url = () => "https://raw.githubusercontent.com/1dy/mao/neat/max-amex-offer";
  const ERROR_LOAD_LIB_OR_MAX_AMEX_OFFER = "Error loading libraries or max-amex-offer:";
  const ERROR_FETCH_MAX_AMEX_OFFER = "Error fetching max-amex-offer:";

  GM.xmlHttpRequest({
    method: "GET",
    url: url(),
    onload: async function (response) {
      typeof unsafeWindow !== "undefined" && (unsafeWindow._get_monkey = () => GM);
      typeof window !== "undefined" && (window._get_monkey = () => GM);
      if (response.status >= 200 && response.status < 300) {
        const requiredLibs = parseRequiredLibraries(response.responseText);
        try {
          await Promise.all(requiredLibs.map((url) => addLib(url)));
          safeEval(response.responseText);
        } catch (error) {
          console.debug(ERROR_MSG.LOAD, error);
        }
      } else {
        console.debug(ERROR_MSG.FETCH, response.status, response.statusText);
      }
    },
    onerror: function (error) {
      console.debug(ERROR_MSG.FETCH, error);
    },
  });
})();
