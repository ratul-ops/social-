import { initializeApp } from "firebase/app";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";
import {
    getDatabase,
    ref,
    set,
    push,
    onChildAdded,
    onChildChanged,
    onChildRemoved,
    get,
    update,
    remove,
    query,
    orderByChild,
    equalTo
} from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyCzF7ryEQXMsbDdU_rhwiCbvj02pZM_5VA",
    authDomain: "ratul-ac3f6.firebaseapp.com",
    databaseURL: "https://ratul-ac3f6-default-rtdb.firebaseio.com",
    projectId: "ratul-ac3f6",
    storageBucket: "ratul-ac3f6.firebasestorage.app",
    messagingSenderId: "675664435593",
    appId: "1:675664435593:web:880a122d6d3a3ef3f96958",
    measurementId: "G-NSYX56DJ1D"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// ============================================
// GOOGLE AUTH
// ============================================
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ============================================
// DOM ELEMENTS
// ============================================
const loginPage = document.getElementById('loginPage');
const registerPage = document.getElementById('registerPage');
const feedPage = document.getElementById('feedPage');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const errorMsg = document.getElementById('errorMsg');
const verificationPending = document.getElementById('verificationPending');
const googleSignInBtn = document.getElementById('googleSignInBtn');

const regFullName = document.getElementById('regFullName');
const regUsername = document.getElementById('regUsername');
const usernameCheck = document.getElementById('usernameCheck');
const regDob = document.getElementById('regDob');
const regGender = document.getElementById('regGender');
const regPhone = document.getElementById('regPhone');
const regEmail = document.getElementById('regEmail');
const regPassword = document.getElementById('regPassword');
const regConfirmPassword = document.getElementById('regConfirmPassword');
const registerBtn = document.getElementById('registerBtn');
const registerErrorMsg = document.getElementById('registerErrorMsg');

const showRegisterBtn = document.getElementById('showRegisterBtn');
const showLoginBtn = document.getElementById('showLoginBtn');

const postInput = document.getElementById('postInput');
const postBtn = document.getElementById('postBtn');
const postContainer = document.getElementById('postContainer');
const feedUserAvatar = document.getElementById('feedUserAvatar');

const profileAvatar = document.getElementById('profileAvatar');
const profileName = document.getElementById('profileName');
const profileUsername = document.getElementById('profileUsername');
const profileBio = document.getElementById('profileBio');
const profileLocation = document.getElementById('profileLocation');
const profileWebsite = document.getElementById('profileWebsite');
const postCount = document.getElementById('postCount');
const followerCount = document.getElementById('followerCount');
const followingCount = document.getElementById('followingCount');
const followBtn = document.getElementById('followBtn');
const profilePostsContainer = document.getElementById('profilePostsContainer');

const friendRequestsList = document.getElementById('friendRequestsList');
const friendsList = document.getElementById('friendsList');
const friendRequestBadge = document.getElementById('friendRequestBadge');

const chatList = document.getElementById('chatList');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const chatHeader = document.getElementById('chatHeader');
const chatInputArea = document.getElementById('chatInputArea');
const messageBadge = document.getElementById('messageBadge');

const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

const feedContent = document.getElementById('feedContent');
const profileContent = document.getElementById('profileContent');
const friendsContent = document.getElementById('friendsContent');
const messagesContent = document.getElementById('messagesContent');

const editProfileModal = document.getElementById('editProfileModal');
const editFullName = document.getElementById('editFullName');
const editUsername = document.getElementById('editUsername');
const editUsernameCheck = document.getElementById('editUsernameCheck');
const editBio = document.getElementById('editBio');
const editLocation = document.getElementById('editLocation');
const editWebsite = document.getElementById('editWebsite');
const saveProfileBtn = document.getElementById('saveProfileBtn');

const notifSender = document.getElementById('notifSender');
const notifMessage = document.getElementById('notifMessage');
const messageNotification = document.getElementById('messageNotification');

// ============================================
// STATE
// ============================================
let currentUser = null;
let currentUserData = null;
let selectedChatUser = null;
let viewingProfileUid = null;
let isFollowing = false;
let isGoogleSignIn = false;

// ============================================
// UTILITY FUNCTIONS
// ============================================
function showError(msg) {
    if (errorMsg) {
        errorMsg.textContent = msg;
        errorMsg.style.display = 'block';
        setTimeout(() => { if (errorMsg) errorMsg.style.display = 'none'; }, 8000);
    } else { alert(msg); }
}

function showRegisterError(msg) {
    if (registerErrorMsg) {
        registerErrorMsg.textContent = msg;
        registerErrorMsg.style.display = 'block';
        setTimeout(() => { if (registerErrorMsg) registerErrorMsg.style.display = 'none'; }, 8000);
    } else { alert(msg); }
}

function formatTime(timestamp) {
    if (!timestamp) return 'এখন';
    try {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        if (diff < 60) return 'এইমাত্র';
        if (diff < 3600) return Math.floor(diff / 60) + ' মিনিট আগে';
        if (diff < 86400) return Math.floor(diff / 3600) + ' ঘন্টা আগে';
        if (diff < 604800) return Math.floor(diff / 86400) + ' দিন আগে';
        return date.toLocaleDateString('bn-BD');
    } catch { return 'এখন'; }
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function generateChatId(user1, user2) {
    return [user1, user2].sort().join('_');
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function checkUsername(username) {
    if (!username || username.length < 3) {
        return { available: false, message: 'ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return { available: false, message: 'শুধু অক্ষর, সংখ্যা এবং আন্ডারস্কোর ব্যবহার করুন' };
    }
    try {
        const snapshot = await get(ref(database, 'usernames/' + username.toLowerCase()));
        if (snapshot.exists()) {
            return { available: false, message: 'এই ইউজারনেম ইতিমধ্যে নেওয়া হয়েছে' };
        }
        return { available: true, message: '✅ এই ইউজারনেম পাওয়া যায়' };
    } catch (error) {
        return { available: false, message: 'ত্রুটি: ' + error.message };
    }
}

function generateUsername(email) {
    let username = email.split('@')[0].toLowerCase();
    username = username.replace(/[^a-z0-9_]/g, '');
    return username + Math.floor(Math.random() * 1000);
}

// ============================================
// USERNAME CHECK
// ============================================
if (regUsername) {
    regUsername.addEventListener('input', async () => {
        const username = regUsername.value.trim();
        if (username.length < 3) {
            usernameCheck.textContent = 'ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে';
            usernameCheck.className = 'username-taken';
            return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            usernameCheck.textContent = 'শুধু অক্ষর, সংখ্যা এবং আন্ডারস্কোর ব্যবহার করুন';
            usernameCheck.className = 'username-taken';
            return;
        }
        const result = await checkUsername(username);
        usernameCheck.textContent = result.message;
        usernameCheck.className = result.available ? 'username-available' : 'username-taken';
    });
}

if (editUsername) {
    editUsername.addEventListener('input', async () => {
        const username = editUsername.value.trim();
        if (username === currentUserData?.username) {
            editUsernameCheck.textContent = '✅ আপনার বর্তমান ইউজারনেম';
            editUsernameCheck.className = 'username-available';
            return;
        }
        if (username.length < 3) {
            editUsernameCheck.textContent = 'ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে';
            editUsernameCheck.className = 'username-taken';
            return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            editUsernameCheck.textContent = 'শুধু অক্ষর, সংখ্যা এবং আন্ডারস্কোর ব্যবহার করুন';
            editUsernameCheck.className = 'username-taken';
            return;
        }
        const result = await checkUsername(username);
        editUsernameCheck.textContent = result.message;
        editUsernameCheck.className = result.available ? 'username-available' : 'username-taken';
    });
}

// ============================================
// PAGE NAVIGATION
// ============================================
function showFeed() {
    if (feedContent) feedContent.style.display = 'block';
    if (profileContent) profileContent.style.display = 'none';
    if (friendsContent) friendsContent.style.display = 'none';
    if (messagesContent) messagesContent.style.display = 'none';
    loadPosts();
}

function showProfile() {
    if (feedContent) feedContent.style.display = 'none';
    if (profileContent) profileContent.style.display = 'block';
    if (friendsContent) friendsContent.style.display = 'none';
    if (messagesContent) messagesContent.style.display = 'none';
    viewingProfileUid = currentUser.uid;
    loadUserProfile(currentUser.uid);
}

function showFriends() {
    if (feedContent) feedContent.style.display = 'none';
    if (profileContent) profileContent.style.display = 'none';
    if (friendsContent) friendsContent.style.display = 'block';
    if (messagesContent) messagesContent.style.display = 'none';
    loadFriends();
    loadFriendRequests();
}

function showMessages() {
    if (feedContent) feedContent.style.display = 'none';
    if (profileContent) profileContent.style.display = 'none';
    if (friendsContent) friendsContent.style.display = 'none';
    if (messagesContent) messagesContent.style.display = 'block';
    loadChatList();
}

window.showFeed = showFeed;
window.showProfile = showProfile;
window.showFriends = showFriends;
window.showMessages = showMessages;

// ============================================
// GOOGLE SIGN-IN
// ============================================
async function handleGoogleSignIn() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        isGoogleSignIn = true;

        const userRef = ref(database, 'users/' + user.uid);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
            let username = generateUsername(user.email);
            let usernameAvailable = false;

            for (let i = 0; i < 10; i++) {
                const check = await checkUsername(username);
                if (check.available) {
                    usernameAvailable = true;
                    break;
                }
                username = generateUsername(user.email) + Math.floor(Math.random() * 1000);
            }

            if (!usernameAvailable) {
                username = 'user' + Date.now();
            }

            await set(ref(database, 'usernames/' + username), { uid: user.uid });

            await set(ref(database, 'users/' + user.uid), {
                fullName: user.displayName || user.email.split('@')[0],
                username: username,
                email: user.email,
                bio: '',
                location: '',
                website: '',
                isVerified: true,
                photoURL: user.photoURL || '',
                createdAt: new Date().toISOString(),
                uid: user.uid
            });

            alert('✅ Google দিয়ে রেজিস্ট্রেশন সফল!\nইউজারনেম: @' + username);
        }

    } catch (error) {
        console.error('Google Sign-In error:', error);
        if (error.code === 'auth/popup-closed-by-user') {
            showError('পপআপ বন্ধ করে দিয়েছেন। আবার চেষ্টা করুন।');
        } else if (error.code === 'auth/account-exists-with-different-credential') {
            showError('এই ইমেইল দিয়ে আগে অ্যাকাউন্ট আছে। পাসওয়ার্ড দিয়ে লগইন করুন।');
        } else {
            showError('Google লগইন ব্যর্থ: ' + error.message);
        }
    }
}

if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', handleGoogleSignIn);
}

// ============================================
// 🔥 AUTHENTICATION - ভেরিফিকেশন ছাড়া
// ============================================
onAuthStateChanged(auth, (user) => {
    console.log('Auth state:', user ? 'Logged in' : 'Logged out');

    if (user) {
        // Google Sign-In users
        if (isGoogleSignIn || user.providerData[0]?.providerId === 'google.com') {
            if (verificationPending) verificationPending.style.display = 'none';
            currentUser = user;
            if (loginPage) loginPage.style.display = 'none';
            if (registerPage) registerPage.style.display = 'none';
            if (feedPage) feedPage.style.display = 'block';

            get(ref(database, 'users/' + user.uid)).then((snapshot) => {
                if (snapshot.exists()) {
                    currentUserData = snapshot.val();
                    if (feedUserAvatar) feedUserAvatar.textContent = getInitials(currentUserData.fullName);
                    showFeed();
                    loadFriendRequests();
                    listenForNewMessages();
                    updateMessageBadge();
                } else {
                    signOut(auth);
                }
            });
            return;
        }

        // ============================================
        // ✅ Email/Password - ভেরিফিকেশন চেক নেই
        // ============================================
        if (verificationPending) verificationPending.style.display = 'none';
        currentUser = user;
        if (loginPage) loginPage.style.display = 'none';
        if (registerPage) registerPage.style.display = 'none';
        if (feedPage) feedPage.style.display = 'block';

        get(ref(database, 'users/' + user.uid)).then((snapshot) => {
            if (snapshot.exists()) {
                currentUserData = snapshot.val();
                if (feedUserAvatar) feedUserAvatar.textContent = getInitials(currentUserData.fullName);
                showFeed();
                loadFriendRequests();
                listenForNewMessages();
                updateMessageBadge();
            } else {
                // If user exists in auth but not in database, create entry
                console.log('User found in auth but not in database. Creating entry...');
                const newUserData = {
                    fullName: user.email.split('@')[0],
                    username: generateUsername(user.email),
                    email: user.email,
                    bio: '',
                    location: '',
                    website: '',
                    isVerified: true,
                    createdAt: new Date().toISOString(),
                    uid: user.uid
                };
                
                set(ref(database, 'users/' + user.uid), newUserData).then(() => {
                    currentUserData = newUserData;
                    if (feedUserAvatar) feedUserAvatar.textContent = getInitials(currentUserData.fullName);
                    showFeed();
                    loadFriendRequests();
                    listenForNewMessages();
                    updateMessageBadge();
                });
            }
        });
    } else {
        currentUser = null;
        currentUserData = null;
        isGoogleSignIn = false;
        if (loginPage) loginPage.style.display = 'flex';
        if (registerPage) registerPage.style.display = 'none';
        if (feedPage) feedPage.style.display = 'none';
        if (postContainer) postContainer.innerHTML = '';
    }
});

// ============================================
// REGISTER - ভেরিফিকেশন ছাড়া
// ============================================
if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
        const fullName = regFullName ? regFullName.value.trim() : '';
        const username = regUsername ? regUsername.value.trim().toLowerCase() : '';
        const dob = regDob ? regDob.value : '';
        const gender = regGender ? regGender.value : '';
        const phone = regPhone ? regPhone.value.trim() : '';
        const email = regEmail ? regEmail.value.trim() : '';
        const password = regPassword ? regPassword.value : '';
        const confirmPassword = regConfirmPassword ? regConfirmPassword.value : '';

        if (!fullName || !username || !dob || !gender || !email || !password || !confirmPassword) {
            showRegisterError('সব ফিল্ড পূরণ করুন!');
            return;
        }

        if (password.length < 6) {
            showRegisterError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে!');
            return;
        }

        if (password !== confirmPassword) {
            showRegisterError('পাসওয়ার্ড মিলছে না!');
            return;
        }

        if (!isValidEmail(email)) {
            showRegisterError('সঠিক ইমেইল দিন!');
            return;
        }

        const usernameCheckResult = await checkUsername(username);
        if (!usernameCheckResult.available) {
            showRegisterError(usernameCheckResult.message);
            return;
        }

        try {
            // Create user - NO verification email sent
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // ✅ Save username
            await set(ref(database, 'usernames/' + username), { uid: user.uid });

            // ✅ Save user data
            await set(ref(database, 'users/' + user.uid), {
                fullName: fullName,
                username: username,
                dob: dob,
                gender: gender,
                phone: phone,
                email: email,
                bio: '',
                location: '',
                website: '',
                isVerified: true,
                createdAt: new Date().toISOString(),
                uid: user.uid
            });

            // Clear form
            if (regFullName) regFullName.value = '';
            if (regUsername) regUsername.value = '';
            if (regDob) regDob.value = '';
            if (regGender) regGender.value = '';
            if (regPhone) regPhone.value = '';
            if (regEmail) regEmail.value = '';
            if (regPassword) regPassword.value = '';
            if (regConfirmPassword) regConfirmPassword.value = '';
            if (registerErrorMsg) registerErrorMsg.style.display = 'none';

            // ✅ সরাসরি লগইন হয়ে যাবে - onAuthStateChanged handle করবে
            alert('✅ রেজিস্ট্রেশন সফল! আপনি লগইন হয়ে গেছেন।');

        } catch (error) {
            console.error('Registration error:', error);
            if (error.code === 'auth/email-already-in-use') {
                showRegisterError('এই ইমেইল ইতিমধ্যে ব্যবহার হচ্ছে!');
            } else if (error.code === 'auth/invalid-email') {
                showRegisterError('সঠিক ইমেইল দিন!');
            } else if (error.code === 'auth/operation-not-allowed') {
                showRegisterError('⚠️ Firebase Console এ Authentication Enable করুন!');
            } else {
                showRegisterError('এরর: ' + error.message);
            }
        }
    });
}

// ============================================
// LOGIN - ভেরিফিকেশন চেক ছাড়া
// ============================================
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const email = loginEmail ? loginEmail.value.trim() : '';
        const password = loginPassword ? loginPassword.value.trim() : '';

        if (!email || !password) {
            showError('ইমেইল এবং পাসওয়ার্ড দিন!');
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // ✅ NO verification check - সরাসরি লগইন
            console.log('✅ Login successful for:', email);
            if (loginEmail) loginEmail.value = '';
            if (loginPassword) loginPassword.value = '';
            if (errorMsg) errorMsg.style.display = 'none';

        } catch (error) {
            console.error('Login error:', error);
            if (error.code === 'auth/user-not-found') {
                showError('এই ইমেইল দিয়ে অ্যাকাউন্ট নেই!');
            } else if (error.code === 'auth/wrong-password') {
                showError('পাসওয়ার্ড ভুল!');
            } else if (error.code === 'auth/too-many-requests') {
                showError('অনেক চেষ্টা করেছেন, কিছুক্ষণ পর চেষ্টা করুন!');
            } else {
                showError('এরর: ' + error.message);
            }
        }
    });
}

// ============================================
// LOGOUT
// ============================================
window.logout = function() {
    signOut(auth);
};

// ============================================
// SHOW/HIDE PAGES
// ============================================
if (showRegisterBtn) {
    showRegisterBtn.addEventListener('click', () => {
        if (loginPage) loginPage.style.display = 'none';
        if (registerPage) registerPage.style.display = 'flex';
        if (errorMsg) errorMsg.style.display = 'none';
        if (registerErrorMsg) registerErrorMsg.style.display = 'none';
        if (verificationPending) verificationPending.style.display = 'none';
    });
}

if (showLoginBtn) {
    showLoginBtn.addEventListener('click', () => {
        if (loginPage) loginPage.style.display = 'flex';
        if (registerPage) registerPage.style.display = 'none';
        if (errorMsg) errorMsg.style.display = 'none';
        if (registerErrorMsg) registerErrorMsg.style.display = 'none';
        if (verificationPending) verificationPending.style.display = 'none';
    });
}

if (loginPassword) {
    loginPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && loginBtn) loginBtn.click();
    });
}

if (regConfirmPassword) {
    regConfirmPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && registerBtn) registerBtn.click();
    });
}

// ============================================
// POSTS
// ============================================
function loadPosts() {
    if (!postContainer) return;
    const postsRef = ref(database, 'posts');
    const existingCards = postContainer.querySelectorAll('.post-card');
    existingCards.forEach(card => card.remove());

    onChildAdded(postsRef, (snapshot) => {
        const post = snapshot.val();
        post.id = snapshot.key;
        addPostToDOM(post);
    });

    onChildChanged(postsRef, (snapshot) => {
        const updatedPost = snapshot.val();
        updatedPost.id = snapshot.key;
        updatePostInDOM(updatedPost);
    });

    onChildRemoved(postsRef, (snapshot) => {
        removePostFromDOM(snapshot.key);
    });
}

function addPostToDOM(post) {
    if (!postContainer) return;
    const card = document.createElement('div');
    card.className = 'post-card';
    card.id = 'post-' + post.id;

    const isLiked = post.likes && post.likes[currentUser?.uid] ? true : false;
    const likeCount = post.likes ? Object.keys(post.likes).length : 0;
    const isOwner = post.uid === currentUser?.uid;

    card.innerHTML = `
        <div class="post-header">
            <div class="avatar" onclick="viewUserProfile('${post.uid}')">${getInitials(post.userName)}</div>
            <div>
                <div class="post-name" onclick="viewUserProfile('${post.uid}')">${post.userName || 'অজানা'}</div>
                <div class="post-username">@${post.username || ''}</div>
                <div class="post-time">${formatTime(post.createdAt)}</div>
            </div>
            ${isOwner ? `<button class="delete-btn" onclick="window.deletePost('${post.id}')">🗑️</button>` : ''}
        </div>
        <div class="post-content">${post.content}</div>
        <div class="post-actions">
            <button onclick="window.likePost('${post.id}')" class="${isLiked ? 'liked' : ''}">
                ❤️ <span class="like-count">${likeCount}</span>
            </button>
            <button onclick="window.toggleComments('${post.id}')">💬</button>
            <button onclick="window.sharePost('${post.id}')">↗️</button>
        </div>
        <div id="comments-${post.id}" class="comments-section"></div>
    `;

    postContainer.prepend(card);
    loadComments(post.id);
}

function updatePostInDOM(post) {
    const card = document.getElementById('post-' + post.id);
    if (!card) return;
    const likeCount = post.likes ? Object.keys(post.likes).length : 0;
    const isLiked = post.likes && post.likes[currentUser?.uid] ? true : false;
    const actionsDiv = card.querySelector('.post-actions');
    if (actionsDiv) {
        const likeBtn = actionsDiv.querySelector('button:first-child');
        if (likeBtn) {
            likeBtn.innerHTML = `❤️ <span class="like-count">${likeCount}</span>`;
            likeBtn.className = isLiked ? 'liked' : '';
        }
    }
}

function removePostFromDOM(postId) {
    const card = document.getElementById('post-' + postId);
    if (card) card.remove();
}

if (postBtn) {
    postBtn.addEventListener('click', async () => {
        const content = postInput ? postInput.value.trim() : '';
        if (!content) {
            alert('দয়া করে কিছু লিখুন!');
            return;
        }
        try {
            const newPostRef = push(ref(database, 'posts'));
            await set(newPostRef, {
                content: content,
                uid: currentUser.uid,
                userName: currentUserData.fullName,
                username: currentUserData.username,
                createdAt: new Date().toISOString(),
                likes: {}
            });
            if (postInput) postInput.value = '';
        } catch (error) {
            alert('পোস্ট করতে ব্যর্থ: ' + error.message);
        }
    });
}

window.likePost = async function(postId) {
    if (!currentUser) return;
    try {
        const postRef = ref(database, 'posts/' + postId);
        const snapshot = await get(postRef);
        if (snapshot.exists()) {
            const post = snapshot.val();
            const likes = post.likes || {};
            if (likes[currentUser.uid]) {
                delete likes[currentUser.uid];
            } else {
                likes[currentUser.uid] = true;
            }
            await update(postRef, { likes: likes });
        }
    } catch (error) {
        console.error('Like error:', error);
    }
};

window.deletePost = async function(postId) {
    if (!confirm('ডিলিট করবেন?')) return;
    try {
        await remove(ref(database, 'posts/' + postId));
    } catch (error) {
        alert('ডিলিট ব্যর্থ: ' + error.message);
    }
};

window.sharePost = async function(postId) {
    if (!currentUser) {
        alert('লগইন করুন!');
        return;
    }
    try {
        const snapshot = await get(ref(database, 'posts/' + postId));
        if (snapshot.exists()) {
            const post = snapshot.val();
            const newPostRef = push(ref(database, 'posts'));
            await set(newPostRef, {
                content: post.content + ' (শেয়ার)',
                uid: currentUser.uid,
                userName: currentUserData.fullName,
                username: currentUserData.username,
                createdAt: new Date().toISOString(),
                likes: {},
                sharedFrom: postId
            });
        }
    } catch (error) {
        alert('শেয়ার ব্যর্থ: ' + error.message);
    }
};

// ============================================
// COMMENTS
// ============================================
function loadComments(postId) {
    const commentsRef = ref(database, 'comments/' + postId);
    onChildAdded(commentsRef, (snapshot) => {
        const comment = snapshot.val();
        comment.id = snapshot.key;
        addCommentToDOM(postId, comment);
    });
    onChildRemoved(commentsRef, (snapshot) => {
        removeCommentFromDOM(postId, snapshot.key);
    });
}

function addCommentToDOM(postId, comment) {
    const commentsDiv = document.getElementById('comments-' + postId);
    if (!commentsDiv) return;
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment-item';
    commentDiv.id = 'comment-' + comment.id;
    const isOwner = comment.uid === currentUser?.uid;
    commentDiv.innerHTML = `
        <div><strong>${comment.userName || 'অজানা'}:</strong> ${comment.text}</div>
        ${isOwner ? `<button onclick="window.deleteComment('${postId}','${comment.id}')" style="background:none;border:none;font-size:14px;cursor:pointer;">🗑️</button>` : ''}
    `;
    commentsDiv.appendChild(commentDiv);
}

function removeCommentFromDOM(postId, commentId) {
    const commentDiv = document.getElementById('comment-' + commentId);
    if (commentDiv) commentDiv.remove();
}

window.toggleComments = function(postId) {
    const commentsDiv = document.getElementById('comments-' + postId);
    if (!commentsDiv) return;
    if (commentsDiv.style.display === 'block') {
        commentsDiv.style.display = 'none';
        return;
    }
    commentsDiv.style.display = 'block';
    let inputDiv = commentsDiv.querySelector('.comment-input');
    if (!inputDiv) {
        inputDiv = document.createElement('div');
        inputDiv.className = 'comment-input';
        inputDiv.innerHTML = `
            <input type="text" placeholder="মন্তব্য..." id="commentInput-${postId}" />
            <button onclick="window.addComment('${postId}')">পোস্ট</button>
        `;
        commentsDiv.appendChild(inputDiv);
        inputDiv.querySelector('input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') window.addComment(postId);
        });
    }
};

window.addComment = async function(postId) {
    if (!currentUser) {
        alert('লগইন করুন!');
        return;
    }
    const input = document.getElementById('commentInput-' + postId);
    const text = input ? input.value.trim() : '';
    if (!text) return;
    try {
        const commentRef = push(ref(database, 'comments/' + postId));
        await set(commentRef, {
            text: text,
            uid: currentUser.uid,
            userName: currentUserData.fullName,
            username: currentUserData.username,
            createdAt: new Date().toISOString()
        });
        if (input) input.value = '';
    } catch (error) {
        alert('মন্তব্য ব্যর্থ: ' + error.message);
    }
};

window.deleteComment = async function(postId, commentId) {
    if (!confirm('ডিলিট করবেন?')) return;
    try {
        await remove(ref(database, 'comments/' + postId + '/' + commentId));
    } catch (error) {
        alert('ডিলিট ব্যর্থ: ' + error.message);
    }
};

// ============================================
// USER PROFILE
// ============================================
async function loadUserProfile(uid) {
    try {
        const snapshot = await get(ref(database, 'users/' + uid));
        if (!snapshot.exists()) {
            alert('ব্যবহারকারী পাওয়া যায়নি');
            return;
        }

        const userData = snapshot.val();

        if (profileAvatar) profileAvatar.textContent = getInitials(userData.fullName);
        if (profileName) profileName.textContent = userData.fullName;
        if (profileUsername) profileUsername.textContent = '@' + userData.username;
        if (profileBio) profileBio.textContent = userData.bio || 'আমার সম্পর্কে লিখুন...';
        if (profileLocation) profileLocation.innerHTML = '<i class="fas fa-map-marker-alt"></i> ' + (userData.location || 'অজানা');
        if (profileWebsite) profileWebsite.innerHTML = '<i class="fas fa-link"></i> ' + (userData.website || 'ওয়েবসাইট নেই');

        const postsSnapshot = await get(query(ref(database, 'posts'), orderByChild('uid'), equalTo(uid)));
        if (postCount) postCount.textContent = postsSnapshot.exists() ? postsSnapshot.size : 0;

        // Get followers count
        const followersSnapshot = await get(ref(database, 'followers/' + uid));
        if (followerCount) followerCount.textContent = followersSnapshot.exists() ? Object.keys(followersSnapshot.val()).length : 0;

        // Get following count
        const followingSnapshot = await get(ref(database, 'following/' + uid));
        if (followingCount) followingCount.textContent = followingSnapshot.exists() ? Object.keys(followingSnapshot.val()).length : 0;

        // ============================================
        // FRIEND SYSTEM
        // ============================================
        if (uid !== currentUser.uid) {
            if (followBtn) {
                followBtn.style.display = 'block';
                
                // Check if already friends
                const friendCheck = await get(ref(database, 'friends/' + currentUser.uid + '/friends/' + uid));
                const isFriend = friendCheck.exists();
                
                // Check if request sent
                const requestCheck = await get(ref(database, 'friends/' + uid + '/requests/' + currentUser.uid));
                const requestSent = requestCheck.exists() && requestCheck.val() === 'pending';
                
                // Check if request received
                const receivedCheck = await get(ref(database, 'friends/' + currentUser.uid + '/requests/' + uid));
                const receivedRequest = receivedCheck.exists() && receivedCheck.val() === 'pending';
                
                if (isFriend) {
                    followBtn.textContent = '💬 মেসেজ';
                    followBtn.className = '';
                    followBtn.onclick = () => window.startChat(uid);
                    followBtn.style.background = '#42b72a';
                    followBtn.style.color = 'white';
                } else if (requestSent) {
                    followBtn.textContent = '⏳ রিকোয়েস্ট পাঠানো হয়েছে';
                    followBtn.className = '';
                    followBtn.onclick = null;
                    followBtn.style.background = '#e4e6eb';
                    followBtn.style.color = '#333';
                } else if (receivedRequest) {
                    followBtn.textContent = '✅ রিকোয়েস্ট গ্রহণ করুন';
                    followBtn.className = '';
                    followBtn.onclick = () => window.acceptFriend(uid);
                    followBtn.style.background = '#27ae60';
                    followBtn.style.color = 'white';
                } else {
                    followBtn.textContent = '➕ বন্ধু করুন';
                    followBtn.className = '';
                    followBtn.onclick = () => window.sendFriendRequest(uid);
                    followBtn.style.background = '#1877f2';
                    followBtn.style.color = 'white';
                }
            }
        } else {
            if (followBtn) {
                followBtn.style.display = 'none';
            }
        }

        loadUserPosts(uid);

    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

async function loadUserPosts(uid) {
    if (!profilePostsContainer) return;
    try {
        const postsRef = ref(database, 'posts');
        const userPostsQuery = query(postsRef, orderByChild('uid'), equalTo(uid));
        const snapshot = await get(userPostsQuery);

        profilePostsContainer.innerHTML = '';

        if (snapshot.exists()) {
            const posts = [];
            snapshot.forEach((child) => {
                posts.push({ id: child.key, ...child.val() });
            });
            posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            posts.forEach(post => {
                const card = document.createElement('div');
                card.className = 'post-card';
                const isLiked = post.likes && post.likes[currentUser?.uid] ? true : false;
                const likeCount = post.likes ? Object.keys(post.likes).length : 0;
                card.innerHTML = `
                    <div class="post-header">
                        <div class="avatar">${getInitials(post.userName)}</div>
                        <div>
                            <div class="post-name">${post.userName}</div>
                            <div class="post-username">@${post.username || ''}</div>
                            <div class="post-time">${formatTime(post.createdAt)}</div>
                        </div>
                    </div>
                    <div class="post-content">${post.content}</div>
                    <div class="post-actions">
                        <button class="${isLiked ? 'liked' : ''}">❤️ ${likeCount}</button>
                        <button>💬</button>
                    </div>
                `;
                profilePostsContainer.appendChild(card);
            });
        } else {
            profilePostsContainer.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">কোন পোস্ট নেই</p>';
        }
    } catch (error) {
        console.error('Error loading user posts:', error);
    }
}

window.viewUserProfile = async function(uid) {
    if (uid === currentUser?.uid) {
        showProfile();
        return;
    }
    viewingProfileUid = uid;
    showProfile();
    await loadUserProfile(uid);
};

window.editProfile = function() {
    if (viewingProfileUid !== currentUser.uid) return;
    if (editFullName) editFullName.value = currentUserData.fullName || '';
    if (editUsername) editUsername.value = currentUserData.username || '';
    if (editBio) editBio.value = currentUserData.bio || '';
    if (editLocation) editLocation.value = currentUserData.location || '';
    if (editWebsite) editWebsite.value = currentUserData.website || '';
    if (editProfileModal) editProfileModal.style.display = 'block';
};

window.closeEditProfile = function() {
    if (editProfileModal) editProfileModal.style.display = 'none';
};

if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', async () => {
        const fullName = editFullName ? editFullName.value.trim() : '';
        const username = editUsername ? editUsername.value.trim().toLowerCase() : '';
        const bio = editBio ? editBio.value.trim() : '';
        const location = editLocation ? editLocation.value.trim() : '';
        const website = editWebsite ? editWebsite.value.trim() : '';

        if (!fullName || !username) {
            alert('নাম এবং ইউজারনেম প্রয়োজন!');
            return;
        }

        if (username !== currentUserData.username) {
            const result = await checkUsername(username);
            if (!result.available) {
                alert(result.message);
                return;
            }
            await remove(ref(database, 'usernames/' + currentUserData.username));
            await set(ref(database, 'usernames/' + username), { uid: currentUser.uid });
        }

        try {
            await update(ref(database, 'users/' + currentUser.uid), {
                fullName: fullName,
                username: username,
                bio: bio,
                location: location,
                website: website
            });

            currentUserData.fullName = fullName;
            currentUserData.username = username;
            currentUserData.bio = bio;
            currentUserData.location = location;
            currentUserData.website = website;

            closeEditProfile();
            loadUserProfile(currentUser.uid);
            alert('✅ প্রোফাইল আপডেট হয়েছে!');

        } catch (error) {
            alert('ত্রুটি: ' + error.message);
        }
    });
}

window.showProfilePosts = function() {
    loadUserPosts(viewingProfileUid);
};

window.showProfilePhotos = function() {
    alert('ফটো ফিচার আসছে!');
};

window.showProfileVideos = function() {
    alert('ভিডিও ফিচার আসছে!');
};

// ============================================
// FRIEND SYSTEM
// ============================================
window.sendFriendRequest = async function(userId) {
    if (!currentUser) {
        alert('লগইন করুন!');
        return;
    }
    
    if (userId === currentUser.uid) {
        alert('আপনি নিজেকে বন্ধু করতে পারবেন না!');
        return;
    }
    
    try {
        const friendCheck = await get(ref(database, 'friends/' + currentUser.uid + '/friends/' + userId));
        if (friendCheck.exists()) {
            alert('এই ব্যক্তি ইতিমধ্যে আপনার বন্ধু!');
            return;
        }
        
        const requestCheck = await get(ref(database, 'friends/' + userId + '/requests/' + currentUser.uid));
        if (requestCheck.exists()) {
            if (requestCheck.val() === 'pending') {
                alert('আপনি ইতিমধ্যে রিকোয়েস্ট পাঠিয়েছেন!');
                return;
            }
        }
        
        await set(ref(database, 'friends/' + userId + '/requests/' + currentUser.uid), 'pending');
        alert('✅ ফ্রেন্ড রিকোয়েস্ট পাঠানো হয়েছে!');
        
        loadFriends();
        loadFriendRequests();
        
    } catch (error) {
        alert('রিকোয়েস্ট পাঠাতে ব্যর্থ: ' + error.message);
        console.error('Send friend request error:', error);
    }
};

window.acceptFriend = async function(senderId) {
    if (!currentUser) return;
    
    try {
        await update(ref(database, 'friends/' + currentUser.uid + '/requests'), {
            [senderId]: 'accepted'
        });
        
        await update(ref(database, 'friends/' + currentUser.uid + '/friends'), {
            [senderId]: true
        });
        await update(ref(database, 'friends/' + senderId + '/friends'), {
            [currentUser.uid]: true
        });
        
        await remove(ref(database, 'friends/' + senderId + '/requests/' + currentUser.uid));
        
        loadFriendRequests();
        loadFriends();
        loadChatList();
        
        alert('✅ বন্ধু হিসেবে যুক্ত হয়েছে!');
        
    } catch (error) {
        alert('রিকোয়েস্ট গ্রহণ করতে ব্যর্থ: ' + error.message);
        console.error('Accept friend error:', error);
    }
};

window.rejectFriend = async function(senderId) {
    if (!currentUser) return;
    
    try {
        await remove(ref(database, 'friends/' + currentUser.uid + '/requests/' + senderId));
        await remove(ref(database, 'friends/' + senderId + '/requests/' + currentUser.uid));
        
        loadFriendRequests();
        loadFriends();
        
        alert('❌ রিকোয়েস্ট বাতিল করা হয়েছে');
        
    } catch (error) {
        alert('রিকোয়েস্ট বাতিল করতে ব্যর্থ: ' + error.message);
        console.error('Reject friend error:', error);
    }
};

window.removeFriend = async function(friendId) {
    if (!confirm('এই বন্ধুকে রিমুভ করবেন?')) return;
    
    try {
        await remove(ref(database, 'friends/' + currentUser.uid + '/friends/' + friendId));
        await remove(ref(database, 'friends/' + friendId + '/friends/' + currentUser.uid));
        
        loadFriends();
        loadChatList();
        
        alert('❌ বন্ধু রিমুভ করা হয়েছে');
        
    } catch (error) {
        alert('রিমুভ করতে ব্যর্থ: ' + error.message);
        console.error('Remove friend error:', error);
    }
};

async function loadFriendRequests() {
    if (!currentUser) return;
    
    try {
        const requestsRef = ref(database, 'friends/' + currentUser.uid + '/requests');
        const snapshot = await get(requestsRef);
        
        if (friendRequestsList) {
            friendRequestsList.innerHTML = '';
        }
        
        if (snapshot.exists()) {
            const requests = snapshot.val();
            const pendingRequests = Object.keys(requests).filter(key => requests[key] === 'pending');
            
            if (friendRequestBadge) {
                if (pendingRequests.length > 0) {
                    friendRequestBadge.style.display = 'inline';
                    friendRequestBadge.textContent = pendingRequests.length;
                } else {
                    friendRequestBadge.style.display = 'none';
                }
            }
            
            if (pendingRequests.length === 0) {
                if (friendRequestsList) {
                    friendRequestsList.innerHTML = '<p style="color:#666;padding:10px;">কোন ফ্রেন্ড রিকোয়েস্ট নেই</p>';
                }
                return;
            }
            
            for (const senderId of pendingRequests) {
                try {
                    const userSnapshot = await get(ref(database, 'users/' + senderId));
                    if (userSnapshot.exists()) {
                        const user = userSnapshot.val();
                        const div = document.createElement('div');
                        div.className = 'friend-card';
                        div.innerHTML = `
                            <div class="friend-info" style="cursor:pointer;" onclick="window.viewUserProfile('${senderId}')">
                                <div class="friend-avatar" style="background:#1877f2;color:white;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:16px;">${getInitials(user.fullName)}</div>
                                <div>
                                    <div class="friend-name">${user.fullName}</div>
                                    <div class="friend-username">@${user.username}</div>
                                </div>
                            </div>
                            <div class="friend-actions">
                                <button class="btn-accept" onclick="window.acceptFriend('${senderId}')" style="background:#1877f2;color:white;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:500;">✅ গ্রহণ</button>
                                <button class="btn-reject" onclick="window.rejectFriend('${senderId}')" style="background:#e4e6eb;color:#333;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:500;">❌ বাতিল</button>
                            </div>
                        `;
                        if (friendRequestsList) {
                            friendRequestsList.appendChild(div);
                        }
                    }
                } catch (error) {
                    console.error('Error loading sender:', error);
                }
            }
        } else {
            if (friendRequestsList) {
                friendRequestsList.innerHTML = '<p style="color:#666;padding:10px;">কোন ফ্রেন্ড রিকোয়েস্ট নেই</p>';
            }
            if (friendRequestBadge) {
                friendRequestBadge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading friend requests:', error);
    }
}

async function loadFriends() {
    if (!currentUser) return;
    
    try {
        const friendsRef = ref(database, 'friends/' + currentUser.uid + '/friends');
        const snapshot = await get(friendsRef);
        
        if (friendsList) {
            friendsList.innerHTML = '';
        }
        
        if (snapshot.exists()) {
            const friends = snapshot.val();
            const friendIds = Object.keys(friends);
            
            if (friendIds.length === 0) {
                if (friendsList) {
                    friendsList.innerHTML = '<p style="color:#666;padding:10px;">আপনার এখনো কোন বন্ধু নেই</p>';
                }
                return;
            }
            
            for (const friendId of friendIds) {
                try {
                    const userSnapshot = await get(ref(database, 'users/' + friendId));
                    if (userSnapshot.exists()) {
                        const user = userSnapshot.val();
                        const div = document.createElement('div');
                        div.className = 'friend-card';
                        div.innerHTML = `
                            <div class="friend-info" style="cursor:pointer;" onclick="window.viewUserProfile('${friendId}')">
                                <div class="friend-avatar" style="background:#1877f2;color:white;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:16px;">${getInitials(user.fullName)}</div>
                                <div>
                                    <div class="friend-name">${user.fullName}</div>
                                    <div class="friend-username">@${user.username}</div>
                                </div>
                            </div>
                            <div class="friend-actions">
                                <button class="btn-chat" onclick="window.startChat('${friendId}')" style="background:#42b72a;color:white;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:500;">💬 মেসেজ</button>
                                <button class="btn-remove" onclick="window.removeFriend('${friendId}')" style="background:#e74c3c;color:white;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:500;">❌ রিমুভ</button>
                            </div>
                        `;
                        if (friendsList) {
                            friendsList.appendChild(div);
                        }
                    }
                } catch (error) {
                    console.error('Error loading friend:', error);
                }
            }
        } else {
            if (friendsList) {
                friendsList.innerHTML = '<p style="color:#666;padding:10px;">আপনার এখনো কোন বন্ধু নেই</p>';
            }
        }
    } catch (error) {
        console.error('Error loading friends:', error);
    }
}

// ============================================
// MESSAGES
// ============================================
async function loadChatList() {
    if (!currentUser) return;
    try {
        const messagesRef = ref(database, 'messages');
        const snapshot = await get(messagesRef);

        if (chatList) chatList.innerHTML = '';
        const chatUsers = new Map();

        if (snapshot.exists()) {
            const allMessages = snapshot.val();

            Object.keys(allMessages).forEach(chatId => {
                const [user1, user2] = chatId.split('_');
                if (user1 === currentUser.uid || user2 === currentUser.uid) {
                    const otherUser = user1 === currentUser.uid ? user2 : user1;
                    const messages = allMessages[chatId];
                    const keys = Object.keys(messages);
                    if (keys.length > 0) {
                        const lastMsg = messages[keys[keys.length - 1]];
                        chatUsers.set(otherUser, {
                            lastMsg: lastMsg,
                            lastTime: lastMsg.timestamp,
                            unread: 0
                        });
                    }
                }
            });

            if (chatUsers.size === 0) {
                if (chatList) {
                    chatList.innerHTML = `
                        <div class="no-messages">
                            <i class="fas fa-comment-slash"></i>
                            <p>কোন চ্যাট নেই</p>
                            <small style="color:#aaa;">বন্ধুদের সাথে চ্যাট শুরু করুন</small>
                        </div>
                    `;
                }
                return;
            }

            const sortedUsers = Array.from(chatUsers.entries())
                .sort((a, b) => new Date(b[1].lastTime) - new Date(a[1].lastTime));

            for (const [uid, data] of sortedUsers) {
                try {
                    const userSnapshot = await get(ref(database, 'users/' + uid));
                    if (userSnapshot.exists()) {
                        const user = userSnapshot.val();
                        const div = document.createElement('div');
                        div.className = 'chat-item';
                        if (selectedChatUser === uid) {
                            div.classList.add('active');
                        }

                        const timeAgo = formatTime(data.lastTime);
                        const lastMsgText = data.lastMsg.text.substring(0, 30) + (data.lastMsg.text.length > 30 ? '...' : '');

                        div.innerHTML = `
                            <div class="chat-avatar">${getInitials(user.fullName)}</div>
                            <div class="chat-info">
                                <div class="chat-name">${user.fullName}</div>
                                <div class="chat-username">@${user.username}</div>
                                <div class="chat-last-msg">${lastMsgText}</div>
                            </div>
                            <div class="chat-time">${timeAgo}</div>
                        `;

                        div.onclick = () => window.startChat(uid);
                        if (chatList) chatList.appendChild(div);
                    }
                } catch (error) {
                    console.error('Error loading chat user:', error);
                }
            }
        } else {
            if (chatList) {
                chatList.innerHTML = `
                    <div class="no-messages">
                        <i class="fas fa-comment-slash"></i>
                        <p>কোন চ্যাট নেই</p>
                        <small style="color:#aaa;">বন্ধুদের সাথে চ্যাট শুরু করুন</small>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading chat list:', error);
    }
}

window.startChat = async function(otherUid) {
    selectedChatUser = otherUid;
    if (chatInputArea) chatInputArea.style.display = 'flex';
    if (chatInput) chatInput.focus();

    try {
        const snapshot = await get(ref(database, 'users/' + otherUid));
        if (snapshot.exists()) {
            const user = snapshot.val();
            if (chatHeader) {
                chatHeader.innerHTML = `
                    <h4>
                        <span style="display:flex;align-items:center;gap:8px;">
                            <span style="display:inline-block;width:32px;height:32px;border-radius:50%;background:#1877f2;color:white;text-align:center;line-height:32px;font-weight:bold;font-size:14px;">${getInitials(user.fullName)}</span>
                            <span>
                                ${user.fullName}
                                <span style="font-size:11px;color:#666;font-weight:normal;display:block;">@${user.username}</span>
                            </span>
                        </span>
                    </h4>
                    <button class="chat-close-btn" onclick="closeChat()">✕</button>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }

    loadMessages(otherUid);
    showMessages();

    document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.chat-item').forEach(el => {
        if (el.querySelector('.chat-name')?.textContent === user?.fullName) {
            el.classList.add('active');
        }
    });
};

window.closeChat = function() {
    selectedChatUser = null;
    if (chatHeader) chatHeader.innerHTML = '<h4>একটি বন্ধু নির্বাচন করুন</h4>';
    if (chatMessages) chatMessages.innerHTML = '';
    if (chatInputArea) chatInputArea.style.display = 'none';
};

async function loadMessages(otherUid) {
    if (!currentUser || !otherUid) return;
    const chatId = generateChatId(currentUser.uid, otherUid);
    const messagesRef = ref(database, 'messages/' + chatId);

    if (chatMessages) chatMessages.innerHTML = '';

    const snapshot = await get(messagesRef);
    if (snapshot.exists()) {
        const messages = snapshot.val();
        const sortedKeys = Object.keys(messages).sort((a, b) =>
            new Date(messages[a].timestamp) - new Date(messages[b].timestamp)
        );
        sortedKeys.forEach(key => {
            const message = messages[key];
            message.id = key;
            addMessageToDOM(message);
        });
    }

    onChildAdded(messagesRef, (snapshot) => {
        const message = snapshot.val();
        message.id = snapshot.key;
        addMessageToDOM(message);
        setTimeout(() => {
            if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 50);
    });

    await markMessagesAsRead(otherUid);

    setTimeout(() => {
        if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

function addMessageToDOM(message) {
    if (!chatMessages) return;
    if (document.getElementById('msg-' + message.id)) return;

    const div = document.createElement('div');
    div.className = `chat-message ${message.senderId === currentUser?.uid ? 'sent' : 'received'}`;
    div.id = 'msg-' + message.id;

    if (message.senderId !== currentUser?.uid) {
        div.innerHTML = `
            <span class="msg-sender">${message.senderName || 'অজানা'}</span>
            ${message.text}
            <span class="msg-time">${formatTime(message.timestamp)}</span>
        `;
    } else {
        div.innerHTML = `
            ${message.text}
            <span class="msg-time">${formatTime(message.timestamp)}</span>
        `;
    }

    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function markMessagesAsRead(otherUid) {
    if (!currentUser || !otherUid) return;
    try {
        const chatId = generateChatId(currentUser.uid, otherUid);
        const messagesRef = ref(database, 'messages/' + chatId);
        const snapshot = await get(messagesRef);

        if (snapshot.exists()) {
            const messages = snapshot.val();
            const updates = {};
            Object.keys(messages).forEach(key => {
                if (messages[key].receiverId === currentUser.uid && !messages[key].read) {
                    updates[key] = { ...messages[key], read: true, readAt: new Date().toISOString() };
                }
            });
            if (Object.keys(updates).length > 0) {
                await update(messagesRef, updates);
                updateMessageBadge();
            }
        }
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

if (sendMessageBtn) {
    sendMessageBtn.addEventListener('click', sendMessage);
}
if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
}

async function sendMessage() {
    const text = chatInput ? chatInput.value.trim() : '';
    if (!text || !selectedChatUser) return;

    try {
        const chatId = generateChatId(currentUser.uid, selectedChatUser);
        const messagesRef = ref(database, 'messages/' + chatId);

        await push(messagesRef, {
            text: text,
            senderId: currentUser.uid,
            senderName: currentUserData.fullName,
            receiverId: selectedChatUser,
            timestamp: new Date().toISOString(),
            read: false
        });

        if (chatInput) chatInput.value = '';
        loadChatList();
        updateMessageBadge();

    } catch (error) {
        alert('মেসেজ পাঠাতে ব্যর্থ: ' + error.message);
    }
}

window.startChatFromProfile = function() {
    if (viewingProfileUid && viewingProfileUid !== currentUser.uid) {
        window.startChat(viewingProfileUid);
    }
};

// ============================================
// MESSAGE NOTIFICATION
// ============================================
function showMessageNotification(senderName, message) {
    if (!messageNotification || !notifSender || !notifMessage) return;

    notifSender.textContent = senderName + ':';
    notifMessage.textContent = message;
    messageNotification.style.display = 'block';

    setTimeout(() => {
        if (messageNotification) messageNotification.style.display = 'none';
    }, 5000);
}

function listenForNewMessages() {
    if (!currentUser) return;

    const messagesRef = ref(database, 'messages');
    onChildAdded(messagesRef, (snapshot) => {
        const messages = snapshot.val();
        if (messages) {
            Object.values(messages).forEach(msg => {
                if (msg.receiverId === currentUser.uid && !msg.read) {
                    if (selectedChatUser !== msg.senderId) {
                        showMessageNotification(msg.senderName, msg.text);
                        updateMessageBadge();
                    }
                }
            });
        }
    });
}

async function updateMessageBadge() {
    try {
        if (!currentUser) return;
        const messagesRef = ref(database, 'messages');
        const snapshot = await get(messagesRef);
        let unreadCount = 0;

        if (snapshot.exists()) {
            const allMessages = snapshot.val();
            Object.values(allMessages).forEach(chatMessages => {
                Object.values(chatMessages).forEach(msg => {
                    if (msg.receiverId === currentUser.uid && !msg.read) {
                        unreadCount++;
                    }
                });
            });
        }

        if (messageBadge) {
            if (unreadCount > 0) {
                messageBadge.style.display = 'inline';
                messageBadge.textContent = unreadCount;
            } else {
                messageBadge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error updating message badge:', error);
    }
}

// ============================================
// SEARCH
// ============================================
if (searchInput) {
    searchInput.addEventListener('input', async (e) => {
        const query = e.target.value.trim().toLowerCase();

        if (query.length < 2) {
            if (searchResults) searchResults.style.display = 'none';
            return;
        }

        try {
            const snapshot = await get(ref(database, 'users'));
            if (!snapshot.exists()) {
                if (searchResults) searchResults.style.display = 'none';
                return;
            }

            const users = snapshot.val();
            if (searchResults) {
                searchResults.innerHTML = '';
                searchResults.style.display = 'block';
            }
            let found = false;

            Object.keys(users).forEach((uid) => {
                if (uid === currentUser?.uid) return;
                const user = users[uid];
                if (user.username && user.username.toLowerCase().includes(query)) {
                    found = true;
                    const div = document.createElement('div');
                    div.className = 'search-result-item';
                    div.innerHTML = `
                        <span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#1877f2;color:white;text-align:center;line-height:28px;font-weight:bold;font-size:13px;">${getInitials(user.fullName)}</span>
                        <div>
                            <div style="font-weight:500;font-size:14px;">${user.fullName}</div>
                            <div style="font-size:11px;color:#666;">@${user.username}</div>
                        </div>
                    `;
                    div.onclick = () => {
                        if (searchResults) searchResults.style.display = 'none';
                        if (searchInput) searchInput.value = '';
                        window.viewUserProfile(uid);
                    };
                    if (searchResults) searchResults.appendChild(div);
                }
            });

            if (!found && searchResults) {
                searchResults.innerHTML = '<div style="padding:10px 12px;color:#666;text-align:center;font-size:13px;">কোন ব্যবহারকারী পাওয়া যায়নি</div>';
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) {
            if (searchResults) searchResults.style.display = 'none';
        }
    });
}

console.log('🚀 SocialHub চালু হয়েছে!');
console.log('✅ কোনো ইমেইল ভেরিফিকেশন নেই - সরাসরি লগইন!');
