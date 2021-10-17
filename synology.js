var sendToMySyno = function (urls) {
  console.log("get options stored.");
  chrome.storage.sync.get(
    {
      hostname: "",
      username: "",
      password: "",
    },
    function (r) {
      if (r.hostname == "" || r.username == "" || r.password == "") {
        toastr["info"](
          "Please fill in your synology info first at the options page!"
        );
        return;
      }

      getApiInfo(r.hostname, (result) => {
        auth(
          r.hostname,
          result["data"]["SYNO.API.Auth"],
          r.username,
          r.password,
          (sid) => {
            download(
              r.hostname,
              result["data"]["SYNO.DownloadStation.Task"],
              urls,
              r.username,
              r.password,
              sid
            );
          }
        );
      });
    }
  );
};

var getApiInfo = function (host, callback) {
  var synoApiInfoUrl =
    host +
    "/webapi/query.cgi?api=SYNO.API.Info&version=1&method=query&query=SYNO.API.Auth,SYNO.DownloadStation.Task";
  fetch(synoApiInfoUrl)
    .then((r) => r.text())
    .then((result) => {
      obj = JSON.parse(result);
      console.log(obj);
      if (callback) {
        callback(obj);
      }
    });
};

var auth = function (host, authInfo, account, password, callback) {
  var authUrl =
    host +
    "/webapi/" +
    authInfo.path +
    "?api=SYNO.API.Auth&version=" +
    authInfo.maxVersion +
    "&method=login&account=" +
    account +
    "&passwd=" +
    password +
    "&session=DownloadStation&format=cookie";
  fetch(authUrl)
    .then((r) => r.text())
    .then((result) => {
      obj = JSON.parse(result);
      console.log(obj);
      if (callback) {
        callback("auth", obj.data.sid);
      }
    });
};

var download = function (host, downloadInfo, urls, account, password, sid) {
  var url = host + "/webapi/" + downloadInfo.path;
  var data =
    "api=SYNO.DownloadStation.Task" +
    "&version=" +
    downloadInfo.maxVersion +
    "&method=create&uri=" +
    urls +
    "&username=" +
    account +
    "&password=" +
    password +
    "&sid=" +
    sid;

  $.ajax({
    type: "POST",
    url: url,
    data: data,
    success: (result) => {
      console.log("download", result);
      obj = JSON.parse(result);
      if (result.success == true) {
        toastr["info"]("Successfully send to your synology DS!");
      }
    },
  });
};
