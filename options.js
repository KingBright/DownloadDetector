hostname = document.getElementById("hostname");
username = document.getElementById("username");
password = document.getElementById("password");

function restore_options() {
  chrome.storage.sync.get(
    {
      hostname: "",
      username: "",
      password: "",
    },
    function (r) {
      console.log("restore options")
      hostname.value = r.hostname;
      username.value = r.username;
      password.value = r.password;
    }
  );
}

function save_options() {
  chrome.storage.sync.set(
    {
      hostname: hostname.value,
      username: username.value,
      password: password.value,
    },
    function () {
      // Update status to let user know options were saved.
      var status = document.getElementById("status");
      status.textContent = "Options saved.";
      setTimeout(function () {
        status.textContent = "";
      }, 750);
    }
  );
}

document.addEventListener("DOMContentLoaded", restore_options);
document.getElementById("save").addEventListener("click", save_options);
