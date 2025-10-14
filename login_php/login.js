// Called when the user logs in with Google
function handleCredentialResponse(response) {
    const idToken = response.credential;

    // Send token to PHP backend to verify and store session
    fetch('api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: idToken })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showProfile(data.user);
        } else {
            console.error("Login failed:", data.message);
        }
    })
    .catch(err => console.error("Error:", err));
}

// Show the user profile using backend session
function showProfile(user) {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('profile-section').classList.remove('hidden');

    document.getElementById('profile-img').src = user.picture || '';
    document.getElementById('profile-name').textContent = user.name || 'User';
    document.getElementById('profile-email').textContent = user.email || '';
}

// Check if user is already logged in
window.onload = function() {
    fetch('api/me.php')
    .then(res => res.json())
    .then(data => {
        if (data.loggedIn) {
            showProfile(data.user);
        }
    })
    .catch(err => console.log("Not logged in yet."));
}

// Sign out
document.getElementById('logout-btn').addEventListener('click', function() {
    fetch('api/logout.php', { method: 'POST' })
    .then(() => {
        document.getElementById('login-section').classList.remove('hidden');
        document.getElementById('profile-section').classList.add('hidden');
    });
});
