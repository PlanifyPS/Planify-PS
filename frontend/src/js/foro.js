import {
    addUserToForum,
    createForum,
    getAllForumsAvoidingUserForum, getForumMessages,
    getUserForum, sendMessage
} from "../../../backend/utils/forum_utils.js";

const forumList = [];
let currentForum = "Forum Name";
const forumPosts = {};

function renderMessage(msg) {
    const template = document.getElementById("chat-message-template");
    const clone = template.content.cloneNode(true);

    const wrapper = document.createElement("div");
    wrapper.classList.add("chat-message-wrapper");
    if (msg.senderName === "You") {
        wrapper.classList.add("you");
    }

    const bubble = clone.querySelector(".chat-message-bubble");
    clone.querySelector(".sender-name").textContent = msg.senderName;
    clone.querySelector(".message-body").textContent = msg.body;

    wrapper.appendChild(bubble);
    return wrapper;
}

async function initChat(forumTitle) {

    document.getElementById('chat-title').textContent = forumTitle;

    const chatMessages = document.getElementById("chatMessages");
    chatMessages.innerHTML = "";

    const messages = await getForumMessages(forumTitle);
    messages.forEach(msg => {
        const messageNode = renderMessage(msg);
        chatMessages.appendChild(messageNode);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;


}

async function showMessage() {
    const chatInput = document.getElementById("chatInput");
    const chatMessages = document.getElementById("chatMessages");
    const message = chatInput.value.trim();
    if (!message) return;



    chatMessages.appendChild(renderMessage({
        senderName: "You",
        body: message,
    }));

    chatMessages.scrollTop = chatMessages.scrollHeight;

    const forumTitle = document.getElementById('chat-title').textContent
    await sendMessage(forumTitle, chatInput.value);
    chatInput.value = "";
}

async function initChatModal(forumTitle) {
    document.getElementById('forumName').textContent = forumTitle;
    document.getElementById('forumContainer').innerHTML = '';
    currentForum = forumTitle;

    document.getElementById('chatModal').style.display = 'flex';
    await initChat(forumTitle);
}
function addForumToList(forumTitle) {


    const forumListElement = document.getElementById('forumList');
    const newForum = document.createElement('li');
    newForum.textContent = forumTitle;
    newForum.addEventListener('click', async function () {
        await initChatModal(forumTitle);
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
        document.getElementById('searchResults').innerHTML = '';
    })

    resultsContainer.appendChild(resultItem);
}

async function autoCompleteForums() {

    const query = document.getElementById('searchForum').value;
    document.getElementById('searchResults').innerHTML = '';

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
    document.getElementById('chatInput').addEventListener('keydown',(e)=>{
        if (e.key === 'Enter') {
            showMessage();
        }
    })
   
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



await initHome();