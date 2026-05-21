/* =========================
   IMAGE PREVIEW AFTER UPLOAD
========================= */

function previewScan(event) {

   let reader = new FileReader();

   reader.onload = function () {

      let preview = document.getElementById("scanPreview");

      preview.src = reader.result;
      preview.style.display = "block";

   }

   reader.readAsDataURL(event.target.files[0]);

}


/* =========================
   SIMULATE FILE UPLOAD
========================= */

async function uploadScan() {
  const file = document.getElementById("scanFile").files[0];
  if (!file) {
    alert("Please select a scan image first!");
    return;
  }

  // Show loader
  document.getElementById("aiLoader").style.display = "block";

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("http://127.0.0.1:3000/predict", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    // Hide loader
    document.getElementById("aiLoader").style.display = "none";

    // Update result section
    document.getElementById("finding").innerHTML =
      `<b>Finding:</b> ${data.status}`;

    if (data.predictions) {
      document.getElementById("probability").innerHTML =
        `<b>Probability:</b><br>${data.predictions.join("<br>")}`;
    } else {
      document.getElementById("probability").innerHTML =
        `<b>Probability:</b> ${data.top_prediction}`;
    }

    document.getElementById("risk").innerHTML =
      `<b>Risk Level:</b> ${
        data.status.includes("Disease") ? "High Risk" : "Low Risk"
      }`;

    document.getElementById("diagnosis").innerHTML =
      `<b>Suggested Diagnosis:</b> ${data.status}`;

  } catch (err) {
    document.getElementById("aiLoader").style.display = "none";
    alert("Error: " + err);
  }
}

/* =========================
   AI SCAN ANALYSIS
========================= */

function startAIScan() {

   let loader = document.getElementById("aiLoader");

   loader.style.display = "block";

   setTimeout(function () {

      loader.style.display = "none";

      showResult();

   }, 3000);

}


/* =========================
   SCAN RESULT SIMULATION
========================= */

function showResult() {

   // let resultBox = document.getElementById("scanResult");

   let probability = Math.random();

   if (probability > 0.6) {

      resultBox.innerText = "Result: No Lung Disease Detected";
      resultBox.style.color = "green";

   }
   else {

      resultBox.innerText = "Result: Possible Lung Disease Detected";
      resultBox.style.color = "red";

   }

   // resultBox.style.display = "block";

}


/* =========================
   REMOVE FILE
========================= */

function removeFile() {

   document.getElementById("scanFile").value = "";

   document.getElementById("scanPreview").style.display = "none";

   document.getElementById("scanResult").style.display = "none";

   document.getElementById("uploadProgress").style.width = "0%";

}


/* =========================
   NOTIFICATION POPUP
========================= */

function showNotification(message) {

   let box = document.getElementById("notification");

   if (!box) return;

   box.innerText = message;

   box.style.display = "block";

   setTimeout(() => {

      box.style.display = "none";

   }, 3000);

}


/* =========================
   BUTTON CLICK ANIMATION
========================= */

let buttons = document.querySelectorAll("button");

buttons.forEach(btn => {

   btn.addEventListener("click", function () {

      btn.style.transform = "scale(0.95)";

      setTimeout(() => {
         btn.style.transform = "scale(1)";
      }, 200);

   });

});

