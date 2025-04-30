import {
    addUserToForum,
    createForum,
    getAllForumsAvoidingUserForum,
    getUserForum, sendMessage
} from "../../../backend/utils/forum_utils.js";

const forumList = [];
let currentForum = "Forum Name";
const forumPosts = {};

function initChat(forumTitle) {

    document.getElementById('chat-title').textContent = forumTitle;
    // traer los mensajes y mostrarlos


}

function userForumListener(forumTitle){
    document.getElementById('forumName').textContent = forumTitle;
    document.getElementById('forumContainer').innerHTML = '';
    currentForum = forumTitle;

    document.getElementById('chatModal').style.display = 'flex';
    initChat(forumTitle);
}
function addForumToList(forumTitle) {


    const forumListElement = document.getElementById('forumList');
    const newForum = document.createElement('li');
    newForum.textContent = forumTitle;
    newForum.addEventListener('click', function(event){
        userForumListener(forumTitle);
    });
    forumListElement.appendChild(newForum);
    document.getElementById('forumModal').style.display = 'none';
}

async function printUserForums() {

    const forumsList = await getUserForum();
    forumsList.forEach(forum => {
        addForumToList(forum.title);
    })

}


function addToAutoCompleteList(forum) {
    const resultItem = document.createElement('div');
    const resultsContainer = document.getElementById('searchResults');
    resultItem.textContent = forum.id;

    resultItem.addEventListener('click', () => {
        document.getElementById('searchForum').value = forum.id;
    })

    resultsContainer.appendChild(resultItem);
}

async function autoCompleteForums() {

    const query = document.getElementById('searchForum').value;

    if (!query) {
        return;
    }
    const forumsList = await getAllForumsAvoidingUserForum();
    for (const index in forumsList) {
        if(forumsList[index].id.startsWith(query)){
            addToAutoCompleteList(forumsList[index]);
        }
    }


}

async function joinForum() {
    const searchForum = document.getElementById('searchForum');
    await addUserToForum(searchForum.value);
    addForumToList(searchForum.value);
    searchForum.value = '';
    document.getElementById('searchResults').value = '';
    
}

async function saveNewForum() {
    const forumTitle = document.getElementById('forumTitle').value;
    await createForum(forumTitle);
    await addUserToForum(forumTitle);
    addForumToList(forumTitle)
    document.getElementById('forumModal').style.display = 'none';
}

async function setupForumListeners() {
    document.getElementById('searchForum').addEventListener('input', autoCompleteForums);
    document.getElementById('addPost').addEventListener('click', joinForum)
    document.getElementById('saveForum').addEventListener('click', saveNewForum);
    document.getElementById('send-message').addEventListener('click', showMessage);
   
}

async function initHome() {
    if (document.readyState === 'complete') {
        await printUserForums();
        await setupForumListeners();
    } else {
        document.addEventListener('DOMContentLoaded', async () => {
            await printUserForums();
            await setupForumListeners();
        });
    }
}

document.getElementById('close-chat-button').addEventListener("click", function() {
    console.log('close-chat-button');
    document.getElementById('chatModal').style.display = 'none';
})

async function showMessage() {
    const chatInput = document.getElementById("chatInput");
    const chatMessages = document.getElementById("chatMessages");
    const message = chatInput.value.trim();
    if (!message) return;

    const messageEl = document.createElement("div");
    messageEl.innerHTML = `<strong>You:</strong> ${message}`;
    messageEl.style.marginBottom = "10px";

    chatMessages.appendChild(messageEl);

    chatMessages.scrollTop = chatMessages.scrollHeight;

    const forumTitle = document.getElementById('chat-title').textContent
    await sendMessage(forumTitle, chatInput.value);
    chatInput.value = "";
}


document.getElementById('createForum').addEventListener('click', async function () {
    document.getElementById('forumModal').style.display = 'flex';
});


document.querySelectorAll('.close').forEach(button => {
    button.addEventListener('click', function() {
        this.closest('.modal').style.display = 'none';
    });
});


document.getElementById('savePost').addEventListener('click', function() {
    const postTitle = document.getElementById('postTitle').value;
    const postContent = document.getElementById('postContent').value;
    if (postTitle && postContent) {
        const postTemplate = document.getElementById('postTemplate').content.cloneNode(true);
        postTemplate.querySelector('.post-title').textContent = postTitle;
        postTemplate.querySelector('.post-content').textContent = postContent;
        postTemplate.querySelector('.post-date').textContent = new Date().toLocaleString();
        document.getElementById('forumContainer').appendChild(postTemplate);
        if (!forumPosts[currentForum]) {
            forumPosts[currentForum] = [];
        }
        forumPosts[currentForum].push(postTemplate);
        document.getElementById('postModal').style.display = 'none';
    }
});

document.addEventListener('click', function(e) {
    console.log("click");
    const searchBox = document.getElementById('searchForum');
    const resultsContainer = document.getElementById('searchResults');
    if (!searchBox.contains(e.target) && !resultsContainer.contains(e.target)) {
        resultsContainer.innerHTML = '';
    }
});

await initHome();