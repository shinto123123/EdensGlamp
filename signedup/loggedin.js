function toggleDropdown() {
  const menu = document.getElementById("dropdown-menu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

// Optional: Hide dropdown when clicking outside
window.onclick = function(event) {
  if (!event.target.closest('.profile-photo')) {
    document.getElementById("dropdown-menu").style.display = "none";
  }
};