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

// Handle Auth State
auth.onAuthStateChanged(user => {
  document.getElementById("reportForm").style.display = user ? "block" : "none";
  document.getElementById("auth-section").style.display = user ? "none" : "block";
  document.getElementById("statusDisplay").innerText = user
    ? `Logged in as ${user.email}`
    : "Not logged in";
  loadReports();
});

// Sign Up
function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => alert("Signed up!"))
    .catch(err => alert(err.message));
}

// Sign In
function signIn() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => alert("Logged in!"))
    .catch(err => alert(err.message));
}

// Sign Out
function signOut() {
  auth.signOut().then(() => alert("Logged out"));
}

// Submit Report
async function submitReport() {
  const issueType = document.getElementById("issueType").value;
  const user = auth.currentUser;
  if (!user) return alert("Please log in to report");

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const latitude = pos.coords.latitude;
    const longitude = pos.coords.longitude;

    const { locationName, street, city } = await getLocationDetails(latitude, longitude);

    await db.collection("reports").add({
      email: user.email,
      issueType,
      latitude,
      longitude,
      locationName,
      street,
      city,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("Report submitted!");
    loadReports();
  },
  () => alert("Could not fetch location"));
}

// Reverse geocode using OpenStreetMap Nominatim API
async function getLocationDetails(lat, lon) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
    const data = await res.json();
    return {
      locationName: data.display_name || "Unknown",
      street: data.address.road || data.address.suburb || "Unknown street",
      city: data.address.city || data.address.town || data.address.village || "Unknown city"
    };
  } catch {
    return {
      locationName: "Unknown",
      street: "Unknown street",
      city: "Unknown city"
    };
  }
}

// Load and display reports
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
          📍 ${data.street || "Unknown street"}, ${data.city || "Unknown city"}<br>
          🌐 [${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}]<br>
          📌 Reported from: ${data.locationName || "Unknown location"}<br>
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

// Admin-only Delete
function deleteReport(id) {
  if (auth.currentUser?.email !== ADMIN_EMAIL) {
    alert("Only admins can delete reports.");
    return;
  }

  db.collection("reports").doc(id).delete()
    .then(() => {
      alert("Deleted!");
      loadReports();
    })
    .catch(err => {
      console.error("Delete error:", err);
      alert("Failed to delete report.");
    });
}

// Toggle Theme
function toggleTheme() {
  document.body.classList.toggle("dark");
}

// Display User’s Local Authority Info
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

// Init location on load
getLocation();
