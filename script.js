// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAajhsa7eamj4pO0cQQu-8HM6ET4hAMbcA",
  authDomain: "boscohack-df020.firebaseapp.com",
  projectId: "boscohack-df020",
  appId: "1:835210810737:web:98d69cd50b612af2b6d2d0"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const ADMIN_EMAIL = "admin@example.com";

// AUTH
auth.onAuthStateChanged(user => {
  document.getElementById("reportForm").style.display = user ? "block" : "none";
  document.getElementById("auth-section").style.display = user ? "none" : "block";
  document.getElementById("statusDisplay").innerText = user
    ? `Logged in as ${user.email}`
    : "Not logged in";
  loadReports();
});

function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => alert("Signed up!"))
    .catch(err => alert(err.message));
}

function signIn() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => alert("Logged in!"))
    .catch(err => alert(err.message));
}

function signOut() {
  auth.signOut().then(() => alert("Logged out"));
}

// REPORT
async function submitReport() {
  const issueType = document.getElementById("issueType").value;
  const user = auth.currentUser;
  if (!user) return alert("Please log in first");

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords;
    const locationName = await getLocationName(latitude, longitude);

    await db.collection("reports").add({
      email: user.email,
      issueType,
      latitude,
      longitude,
      locationName,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("Report submitted!");
    loadReports();
  }, () => alert("Failed to get location"));
}

// Reverse geocoding with OpenStreetMap
async function getLocationName(lat, lon) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
    );
    const data = await response.json();

    const road = data.address?.road || "";
    const city = data.address?.city || data.address?.town || data.address?.village || "";
    const state = data.address?.state || "";

    if (road || city) {
      return `${road}, ${city}, ${state}`;
    }

    return data.display_name || "Unknown Location";
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return "Unknown Location";
  }
}

// LOAD REPORTS
function loadReports() {
  db.collection("reports")
    .orderBy("timestamp", "desc")
    .get()
    .then(snapshot => {
      const reportList = document.getElementById("reportList");
      reportList.innerHTML = "";
      snapshot.forEach(doc => {
        const data = doc.data();
        const box = document.createElement("div");
        box.className = "report-box";
        box.innerHTML = `
          <strong>${data.issueType}</strong><br>
          🌐 [${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}]<br>
          📌 Reported from: ${data.locationName || "Unknown"}<br>
          🕒 ${data.timestamp?.toDate().toLocaleString() || "Pending"}<br>
          🧑‍💻 ${data.email}
          ${auth.currentUser?.email === ADMIN_EMAIL
            ? `<br><button onclick="deleteReport('${doc.id}')">Delete</button>`
            : ""}
        `;
        reportList.appendChild(box);
      });
    });
}

// DELETE (admin only)
function deleteReport(id) {
  if (auth.currentUser?.email !== ADMIN_EMAIL) return;
  db.collection("reports").doc(id).delete().then(() => {
    alert("Deleted!");
    loadReports();
  });
}

// THEME TOGGLE
function toggleTheme() {
  document.body.classList.toggle("dark");
}

// LOCAL INFO
function getLocation() {
  const info = document.getElementById("local-info");
  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude.toFixed(4);
      const lon = pos.coords.longitude.toFixed(4);
      info.innerText = `Local Authority Zone: [${lat}, ${lon}]`;
    },
    () => info.innerText = "Location unavailable"
  );
}

getLocation();
