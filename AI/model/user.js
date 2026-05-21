document.getElementById("uploadForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const file = document.getElementById("file").files[0];
  const age = document.getElementById("age").value;
  const gender = document.getElementById("gender").value;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("age", age);
  formData.append("gender", gender);

  try {
    const res = await fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    console.log(data);

    // 👉 save data
    localStorage.setItem("report", JSON.stringify(data));

    // 👉 open result page
    window.location.href = "result.html";

  } catch (err) {
    alert("Error: " + err);
  }
});