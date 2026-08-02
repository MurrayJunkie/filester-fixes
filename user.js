// ==UserScript==
// @name         Filester-Fixes
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  Some patches to fix the website behaviour that I find annoying.
// @author       Murray
// @match        https://filester.me/*
// @match        https://filester.sh/*
// @match        https://filester.si/*
// @match        https://filester.gg/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=filester.me
// @grant        unsafeWindow
// ==/UserScript==

(async function () {
    'use strict';

    const css = `
        .filester-fixed-item {
            position: relative; !important;
        }
    `

    document.head.insertAdjacentHTML("beforeend", `<style>${css}</style>`)

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
    ; ((windowOpen) => {
        unsafeWindow.open = function (url, target, features) {
            const u = new URL(url, location.href)
            if (target === "_blank" && u.searchParams.get("download") === "true") {
                downloadWithFullReferrer(url)
                return
            }

            return windowOpen.apply(this, arguments);
        }
    })(unsafeWindow.open)

    function waitForElement(selector) {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                const element = document.querySelector(selector);
                if (element == null) return;

                clearInterval(interval);
                resolve(element);
            }, 100)
        });
    }

    function addLinkToItem(item) {
        const [_, slug] = /window\.location\.href='(.*?)'/.exec(item.getAttribute('onclick'))

        const a = document.createElement("a");
        a.addEventListener("click", (e) => e.stopPropagation());
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
        item.classList.add("filester-fixed-item");
    }

    for (const item of document.querySelectorAll(".file-item")) {
        addLinkToItem(item);
    }

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.classList && !node.classList.contains("filester-fixed-item") && node.classList.contains("file-item")) {
                    try {
                        addLinkToItem(node);
                    } catch (e) {
                        console.error(e, node);
                    }
                }
            }
        }
    });

    observer.observe(await waitForElement("body"), { childList: true, subtree: true });

    if (location.pathname.startsWith("/d/")) {

        // Insert thumbail as poster
        const thumbUrl = document.querySelector("meta[property=\"og:image\"]").content
        const vidOverlay = document.querySelector("#videoPlayOverlay")
        vidOverlay.setAttribute("onclick", "window.loadVideo(); window.videoPlayer.autoplay = true;")

        vidOverlay.style.background = "none"
        for (const child of vidOverlay.children) {
            child.style.display = "none"
        }

        const vid = document.querySelector("#videoPlayer")
        vid.poster = thumbUrl
    }

    // Your code here...
})();