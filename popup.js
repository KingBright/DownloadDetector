var supportSchemes;

function loadConfig() {
    supportSchemes = [];
    supportSchemes.push("ftp://");
    supportSchemes.push("ed2k://");
    supportSchemes.push("thunder://");
    supportSchemes.push("magnet:?xt=urn:btih:");
    supportSchemes.push("http://gdl.lixian.vip.xunlei.com");
}

var ftp = [];
var ed2k = [];
var thunder = [];
var magnet = [];
var vip =[];

function getPrefix(url) {
    for (var i = 0; i < supportSchemes.length; i++) {
        if (url.startsWith(supportSchemes[i])) {
            return supportSchemes[i];
        }
    }
    return null;
}

function showError(msg) {
    error = msg;
    updateBadgeAndTitle();
}

function insertIntoArray(prefix, link) {
    var array;
    if (prefix == "ftp://") {
        array = ftp;
    } else if (prefix == "ed2k://") {
        array = ed2k;
    } else if (prefix == "thunder://") {
        array = thunder;
    } else if (prefix == "magnet:?xt=urn:btih:") {
        array = magnet;
    } else {
        array = vip;
    }

    if ($.inArray(link, array) == -1) {
        array.push(link);
        var id = prefix.split(":")[0];
        $("#" + id).append("<li>" + link + "</li>");
    }
}

function detect(tab) {
    if (!tab) {
        console.log("tab empty");
        return;
    }
    console.log("start detect");
    var localRex = /^((?:chrome|file|chrome-extension|about):.*$)/i;
    var result = localRex.exec(tab.url);
    if (result) {
        console.log("Page not supported!");
        // showError("Page not supported!");
        return;
    }

    var validRex = /^((http|https:?):.*$)/i;
    result = validRex.exec(tab.url);
    if (!result) {
        console.log("Page not supported!");
        // showError("Page not supported!");
        return;
    }

    chrome.tabs.executeScript(null,
        {
            code: "document.getElementsByTagName('html')[0].innerHTML;"
        },
        function (page) {
            $(page[0]).find('[src]').each(function () {
                var link = $(this).attr('src');
                var name = $(this).text();
                var prefix = getPrefix(link);

                if (prefix !== null) {
                    insertIntoArray(prefix, link);
                }
            });
            $(page[0]).find('[href]').each(function () {
                var link = $(this).attr('href');
                var name = $(this).text();
                var prefix = getPrefix(link);

                if (prefix !== null) {
                    insertIntoArray(prefix, link);
                }
            });
        }
    );
}
window.onload = function () {
    //Init
    loadConfig();

    chrome.browserAction.onClicked.addListener(function (tab) {
        detect(tab);
    });

    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        if (tabs && tabs.length > 0) {
            detect(tabs[0]);
        }
    });
};
