var supportSchemes;

function loadConfig() {
  validSecondaryLinks = [];
  validSecondaryLinks.push("https://www.chaospace.fun/links");

  supportSchemes = [];
  supportSchemes.push("ftp://");
  supportSchemes.push("ed2k://");
  supportSchemes.push("thunder://");
  supportSchemes.push("magnet:?xt=urn:btih:");
  supportSchemes.push("http://gdl.lixian.vip.xunlei.com");

  toastr.options = {
    closeButton: false,
    debug: false,
    newestOnTop: false,
    progressBar: false,
    positionClass: "toast-top-full-width",
    preventDuplicates: false,
    onclick: null,
    showDuration: "300",
    hideDuration: "1000",
    timeOut: "2500",
    extendedTimeOut: "1000",
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut",
  };
}

var ftp = [];
var ftpName = [];
var ed2k = [];
var ed2kName = [];
var thunder = [];
var thunderName = [];
var magnet = [];
var magnetName = [];
var vip = [];
var vipName = [];

function getPrefix(url) {
  for (var i = 0; i < supportSchemes.length; i++) {
    if (url.startsWith(supportSchemes[i])) {
      return supportSchemes[i];
    }
  }
  return null;
}

function isSecondaryLink(url) {
  for (var i = 0; i < validSecondaryLinks.length; i++) {
    if (url.startsWith(validSecondaryLinks[i])) {
      return true;
    }
  }
  return false;
}

function showError(msg) {
  error = msg;
  updateBadgeAndTitle();
}

function insertIntoArray(prefix, link, name) {
  var array;
  var nameArray;
  if (prefix == "ftp://") {
    array = ftp;
    nameArray = ftpName;
  } else if (prefix == "ed2k://") {
    array = ed2k;
    nameArray = ed2kName;
  } else if (prefix == "thunder://") {
    array = thunder;
    nameArray = thunderName;
  } else if (prefix == "magnet:?xt=urn:btih:") {
    array = magnet;
    nameArray = magnetName;
  } else {
    array = vip;
    nameArray = vipName;
  }

  var body = $("body");

  var id = prefix.split(":")[0];

  var title = $("#" + id + "-title");
  if (title.length == 0) {
    body.append("<h3 id='" + id + "-title'>" + id + "</h3>");
    title = $("#" + id + "-title");
  }

  var list = $("#" + id + "-list");
  if (list.length == 0) {
    body.append("<ul id='" + id + "-list'></ul>");
    list = $("#" + id + "-list");
  }

  var copyBtn = $("#" + id + "-btn");
  if (copyBtn.length == 0) {
    body.append("<button id='" + id + "-btn'>Copy All</button>");
    copyBtn = $("#" + id + "-btn");
    new Clipboard("#" + id + "-btn");
    $("#" + id + "-btn").click(function () {
      toastr["info"]("All links of above items are copied.");
    });
  }

  var sendToSynoBtn = $("#" + id + "-stsbtn");
  if (sendToSynoBtn.length == 0) {
    body.append("<button id='" + id + "-stsbtn'>Send To My Syno</button>");
    sendToSynoBtn = $("#" + id + "-stsbtn");
    $("#" + id + "-stsbtn").click(function () {
      urls = "";
      array.forEach((v, i) => (urls += encodeURIComponent(v) + ","));
      console.log("send to my synology station", urls);
      sendToMySyno(urls);
    });
  }

  if ($.inArray(link, array) == -1) {
    var index = array.push(link);
    nameArray.push(name);

    list.append(
      "<li id='" +
        id +
        "-li" +
        index +
        "' data-clipboard-text='" +
        link +
        "'>" +
        name +
        "</li>"
    );

    new Clipboard("#" + id + "-li" + index);
    $("#" + id + "-li" + index).click(function () {
      toastr["info"]("The link of this item is copied.");
    });

    if (copyBtn.attr("data-clipboard-text")) {
      copyBtn.attr(
        "data-clipboard-text",
        copyBtn.attr("data-clipboard-text") + "\n" + link
      );
    } else {
      copyBtn.attr("data-clipboard-text", link);
    }
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

  async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
  }

  function parsePage(tabId) {
    function getContent() {
      return document.getElementsByTagName("html")[0].innerHTML;
    }
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        func: getContent,
      },
      function (page) {
        content = page[0].result;

        function realFind(context) {
          find(context, "[value]", "value");
          find(context, "[href]", "href");
          find(context, "[src]", "src");
        }

        function find(context, node, attr) {
          $(context)
            .find(node)
            .each(function () {
              var link = $(this).attr(attr);
              var name = $(this).text();
              if (!name) {
                name = link;
              }
              var prefix = getPrefix(link);
              if (prefix !== null) {
                insertIntoArray(prefix, link, name);
              }
              var isValidLink = isSecondaryLink(link);
              if (isValidLink) {
                fetch(link)
                  .then((response) => response.text())
                  .then((response) => {
                    realFind(response);
                  });
              }
            });
        }

        // add setting btn
        var body = $("body");
        body.append("<div><button id='options'>Options</button></div>");
        $("#options").click(function () {
          console.log("open options page");
          let url = chrome.runtime.getURL("options.html");
          let tab = chrome.tabs.create({ url });
        });

        realFind(content);
      }
    );
  }

  tabPromis = getCurrentTab();
  tabPromis.then((tab) => {
    console.log("current tab is ", tab);
    parsePage(tab.id);
  });
}
window.onload = function () {
  //Init
  loadConfig();

  chrome.action.onClicked.addListener(function (tab) {
    detect(tab);
  });

  chrome.tabs.query(
    {
      active: true,
      currentWindow: true,
    },
    function (tabs) {
      if (tabs && tabs.length > 0) {
        detect(tabs[0]);
      }
    }
  );
};
