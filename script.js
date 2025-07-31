// 🔧 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAajhsa7eamj4pO0cQQu-8HM6ET4hAMbcA",
  authDomain: "boscohack-df020.firebaseapp.com",
  projectId: "boscohack-df020",
  appId: "1:835210810737:web:98d69cd50b612af2b6d2d0"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUserEmail = "";

// 👤 Auth State
auth.onAuthStateChanged(user => {
  const form = document.getElementById("reportForm");
  if (user) {
    form.style.display = "block";
    currentUserEmail = user.email;
  } else {
    form.style.display = "none";
    currentUserEmail = "";
  }
  loadReports();
});

// 🔐 Auth Functions
function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => alert("Signed up!"))
    .catch(e => alert(e.message));
}

function signIn() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => alert("Logged in!"))
    .catch(e => alert(e.message));
}

function signOut() {
  auth.signOut().then(() => alert("Logged out"));
}

// 📍 Get Location
function getLocation() {
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: "Unavailable", lng: "Unavailable" })
    );
  });
}

// 📤 Submit Report
async function submitReport() {
  const issueType = document.getElementById("issueType").value;
  const user = auth.currentUser;
  if (!user) return alert("Login required.");

  const location = await getLocation();

  await db.collection("reports").add({
    type: issueType,
    location,
    user: user.email,
    timestamp: new Date()
  });

  alert("Report submitted!");
  document.getElementById("issueType").value = "Pothole";
}

// 📄 Load Reports
function loadReports() {
  const container = document.getElementById("reportList");
  db.collection("reports").orderBy("timestamp", "desc")
    .onSnapshot(snapshot => {
      container.innerHTML = "";
      if (snapshot.empty) {
        container.innerHTML = "<p>No reports yet.</p>";
        return;
      }

      snapshot.forEach(doc => {
        const data = doc.data();
        const div = document.createElement("div");
        div.className = "report-box";
        div.innerHTML = `
          <strong>Issue:</strong> ${data.type}<br>
          <strong>By:</strong> ${data.user}<br>
          <strong>Time:</strong> ${new Date(data.timestamp.toDate()).toLocaleString()}<br>
          <strong>Location:</strong> ${data.location.lat}, ${data.location.lng}
        `;

        // Admin can delete
        if (currentUserEmail === "admin@example.com") {
          const delBtn = document.createElement("button");
          delBtn.textContent = "Delete";
          delBtn.className = "delete-btn";
          delBtn.onclick = () => {
            if (confirm("Delete this report?")) {
              db.collection("reports").doc(doc.id).delete();
            }
          };
          div.appendChild(delBtn);
        }

        container.appendChild(div);
      });
    });
}

// 🌗 Theme toggle
document.getElementById("toggleMode").onclick = () => {
  const body = document.body;
  body.classList.toggle("dark-mode");
  body.classList.toggle("light-mode");
};
