async function submitReport() {
  const issueType = document.getElementById("issueType").value;
  const user = auth.currentUser;

  if (!user) {
    alert("Please log in first.");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude, longitude } = position.coords;

    // Get the location name (street, city)
    const locationName = await getLocationName(latitude, longitude);

    await db.collection("reports").add({
      email: user.email,
      issueType,
      latitude,
      longitude,
      locationName,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("Report submitted successfully!");
    loadReports();
  }, () => {
    alert("Failed to get location.");
  });
}

async function getLocationName(lat, lon) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
    );
    const data = await response.json();
    return data.address.road && data.address.city
      ? `${data.address.road}, ${data.address.city}`
      : data.display_name || "Unknown Location";
  } catch (error) {
    return "Unknown Location";
  }
}
