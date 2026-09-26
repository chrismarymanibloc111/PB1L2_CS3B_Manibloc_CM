/* Local storage keys used by this application */
const USER_STORAGE_KEY = "postit_user";
const POSTS_STORAGE_KEY = "postit_posts";

/* Secret key used by CryptoJS AES encryption */
const ENCRYPTION_KEY = "POSTIT_PB1L2_2026";

/* Get the required HTML elements */
const userSection = document.getElementById("userSection");
const postSection = document.getElementById("postSection");
const userForm = document.getElementById("userForm");
const displayName = document.getElementById("displayName");
const profileMark = document.getElementById("profileMark");
const captionInput = document.getElementById("caption");
const postButton = document.getElementById("postButton");
const postThread = document.getElementById("postThread");
const characterCount = document.getElementById("characterCount");
const threadCount = document.getElementById("threadCount");

/* Start the application after the page is loaded */
document.addEventListener("DOMContentLoaded", function () {
    checkExistingUser();
    updateCharacterCount();
    loadPosts();
});

/* Check whether a user has already been registered on this browser */
function checkExistingUser() {
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (!savedUser) {
        return;
    }

    try {
        const user = JSON.parse(savedUser);

        if (user.fullName) {
            showPostSection(user);
        }
    } catch (error) {
        console.error("Invalid saved user:", error);
        localStorage.removeItem(USER_STORAGE_KEY);
    }
}

/* Save the user's information only once */
userForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const dateOfBirth = document.getElementById("dateOfBirth").value;
    const yearLevel = document.getElementById("yearLevel").value;
    const gender = document.getElementById("gender").value;
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!fullName || !dateOfBirth || !yearLevel || !gender || !username || !password) {
        alert("Please complete all fields.");
        return;
    }

    if (password.length < 4) {
        alert("Password must contain at least 4 characters.");
        return;
    }

    /* The password is hashed before it is stored in localStorage */
    const user = {
        fullName: fullName,
        dateOfBirth: dateOfBirth,
        yearLevel: yearLevel,
        gender: gender,
        username: username,
        passwordHash: CryptoJS.SHA256(password).toString()
    };

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify([]));

    showPostSection(user);
    alert("Profile saved. You can now create your posts.");
});

/* Show the posting area after the one-time profile setup */
function showPostSection(user) {
    userSection.classList.add("hidden");
    postSection.classList.remove("hidden");

    displayName.textContent = user.fullName;
    profileMark.textContent = user.fullName.charAt(0).toUpperCase();

    loadPosts();
}

/* Update the caption character counter */
captionInput.addEventListener("input", updateCharacterCount);

function updateCharacterCount() {
    characterCount.textContent = `${captionInput.value.length} / 500`;
}

/* Add a caption to the user's thread */
postButton.addEventListener("click", function () {
    const caption = captionInput.value.trim();

    if (!caption) {
        alert("Please write a caption before posting.");
        captionInput.focus();
        return;
    }

    const savedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (!savedUser) {
        alert("Please enter your user information first.");
        return;
    }

    const user = JSON.parse(savedUser);

    /* Get the current date and time for the original post */
    const postDate = new Date().toLocaleString();

    /*
       The required original data is:
       Stringified USER NAME + POST + DATE.
       JSON.stringify creates one string containing these values.
    */
    const originalData = JSON.stringify({
        userName: user.fullName,
        post: caption,
        date: postDate
    });

    /*
       AES encrypts the stringified user name, post, and date.
       The encrypted value is what is displayed below ORIGINAL POST.
    */
    const encryptedValue = CryptoJS.AES.encrypt(
        originalData,
        ENCRYPTION_KEY
    ).toString();

    const newPost = {
        originalPost: caption,
        encryptedPost: encryptedValue,
        date: postDate
    };

    const posts = getPosts();
    posts.unshift(newPost);

    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));

    captionInput.value = "";
    updateCharacterCount();
    loadPosts();
});

/* Get all saved posts from localStorage */
function getPosts() {
    try {
        const savedPosts = localStorage.getItem(POSTS_STORAGE_KEY);
        return savedPosts ? JSON.parse(savedPosts) : [];
    } catch (error) {
        console.error("Unable to load posts:", error);
        return [];
    }
}

/* Display all posts as a thread */
function loadPosts() {
    const posts = getPosts();
    postThread.innerHTML = "";

    threadCount.textContent =
        `${posts.length} ${posts.length === 1 ? "post" : "posts"}`;

    if (posts.length === 0) {
        postThread.innerHTML = `
            <div class="empty-message">
                No posts yet. Your first caption will appear here.
            </div>
        `;
        return;
    }

    posts.forEach(function (post) {
        const postCard = document.createElement("article");
        postCard.className = "post-card";

        /* Create elements instead of inserting user text as raw HTML */
        const meta = document.createElement("div");
        meta.className = "post-meta";

        const label = document.createElement("span");
        label.className = "post-label";
        label.textContent = "ORIGINAL POST";

        const date = document.createElement("span");
        date.className = "post-date";
        date.textContent = post.date;

        meta.appendChild(label);
        meta.appendChild(date);

        const original = document.createElement("div");
        original.className = "original-post";
        original.textContent = post.originalPost;

        const encryptedLabel = document.createElement("span");
        encryptedLabel.className = "encrypted-label";
        encryptedLabel.textContent = "ENCRYPTED VALUE";

        const encrypted = document.createElement("code");
        encrypted.className = "encrypted-value";
        encrypted.textContent = post.encryptedPost;

        postCard.appendChild(meta);
        postCard.appendChild(original);
        postCard.appendChild(encryptedLabel);
        postCard.appendChild(encrypted);

        postThread.appendChild(postCard);
    });
}
