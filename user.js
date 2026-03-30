// ==UserScript==
// @name         Filester-Fixes
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Some patches to fix the website behaviour that I find annoying.
// @author       Murray
// @match        https://filester.me/*
// @match        https://filester.sh/*
// @match        https://filester.si/*
// @match        https://filester.gg/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=filester.me
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    function downloadWithFullReferrer(target) {
        const a = document.createElement("a");
        a.href = target;
        a.referrerPolicy = "unsafe-url"
        a.download = "";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // Patch window.open to insert a referrer url to downloads.
    ;((windowOpen) => {
        unsafeWindow.open = function (url, target, features) {
            if (target === "_blank" && url.endsWith("?download=true")) {
                downloadWithFullReferrer(url)
                return
            }

            return windowOpen.apply(this, arguments);
        }
    })(unsafeWindow.open)

    // Insert links to album items instead of opening all in the current tab.
    for (const item of document.querySelectorAll(".file-item")) {
        const [ _, slug ] = /window\.location\.href='(.*?)'/.exec(item.getAttribute('onclick'))

        item.removeAttribute("onclick");
        const a = document.createElement("a");
        a.href = slug;

        Object.assign(a.style, {
            position: "absolute",
            inset: 0,
            zIndex: 10,
            textDecoration: "none",
            color: "inherit"
        });

        if (getComputedStyle(item).position === "static") {
            item.style.position = "relative";
        }

        item.appendChild(a);
    }

    // Your code here...
})();