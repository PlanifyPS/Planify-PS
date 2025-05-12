import {
    addUserToForum,
    createForum,
    getAllForumsAvoidingUserForum, getForumMessages,
    getUserForum, sendMessage
} from "../../../backend/utils/forum_utils.js";
import {getForum, toggleMessageLike} from "../../../backend/utils/firestore_utils.js";

const forumList = [];
let currentForum = "Forum Name";
const forumPosts = {};
let replyPreviewData = null;


function setupLikeButton(likeBtn, isLikedInitial, forumId, messageId, userUID) {
    const heartIcon = likeBtn.querySelector("i");

    if (isLikedInitial) {
        likeBtn.classList.add("liked");
        heartIcon.classList.remove("fa-regular");
        heartIcon.classList.add("fa-solid");
    } else {
        likeBtn.classList.remove("liked");
        heartIcon.classList.remove("fa-solid");
        heartIcon.classList.add("fa-regular");
    }

    likeBtn.addEventListener("click", async () => {
        const isNowLiked = likeBtn.classList.toggle("liked");

        heartIcon.classList.toggle("fa-regular", !isNowLiked);
        heartIcon.classList.toggle("fa-solid", isNowLiked);
        console.log(isNowLiked);
        await toggleMessageLike(forumId, messageId, userUID, isNowLiked);
    });
}

function handleReplyListener(msg){
    const replyTo =  `"${msg.body}" by ${msg.senderName}`;
    document.getElementById("chatInput").placeholder = `Replying to ${replyTo}`;

    const replyPreview = document.getElementById("replyPreview");
    const replyAuthor = replyPreview.querySelector(".reply-author");
    const replyText = replyPreview.querySelector(".reply-text");

    replyAuthor.textContent = msg.senderName + ":";
    replyText.textContent = msg.body;

    replyPreview.classList.remove("hidden");

    // Guardar el ID del mensaje al que se está respondiendo
    chatInput.dataset.replyTo = msg.id;
    replyPreviewData = {
        senderName: msg.senderName,
        body: msg.body
    };

}

function renderMessage(msg, forumId) {
    console.log(msg)
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

    const likeBtn = clone.querySelector(".like-btn");
    setupLikeButton(likeBtn, msg.isLiked, forumId, msg.id, sessionStorage.getItem("uid"));


    clone.querySelector(".reply-btn").addEventListener("click", () => {

        handleReplyListener(msg);
    });
    console.log(msg)
    if (msg.replyPreview) {
        console.log("dentro")
        const replyRef = document.createElement("div");
        replyRef.classList.add("reply-reference");
        replyRef.innerHTML = `<strong>${msg.replyPreview.senderName}:</strong> ${msg.replyPreview.body}`;
        bubble.prepend(replyRef);
    }


    wrapper.appendChild(bubble);
    return wrapper;
}

async function initChat(forumTitle) {



    const chatMessages = document.getElementById("chatMessages");
    chatMessages.innerHTML = "";

    const messages = await getForumMessages(forumTitle);
    messages.forEach(msg => {
        const messageNode = renderMessage(msg, forumTitle,);
        chatMessages.appendChild(messageNode);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;


}

async function showMessage() {
    const chatInput = document.getElementById("chatInput");
    const chatMessages = document.getElementById("chatMessages");
    const replyTo = chatInput.dataset.replyTo || null;

    const message = chatInput.value.trim();
    if (!message) return;


    console.log(replyPreviewData )
    chatMessages.appendChild(renderMessage({
        senderName: "You",
        body: message,
        replyTo: replyTo,
        replyPreview:replyPreviewData,
    },document.getElementById("chat-title").value));

    chatMessages.scrollTop = chatMessages.scrollHeight;

    const forumTitle = document.getElementById('chat-title').firstChild.nodeValue.trim();
    await sendMessage(forumTitle, chatInput.value, replyTo);

    chatInput.value = "";
    replyPreviewData = null;
    chatInput.removeAttribute("data-reply-to");
    document.getElementById("replyPreview").classList.add("hidden");
}

async function initChatModal(forumTitle, category) {

    document.getElementById('forumContainer').innerHTML = '';
    currentForum = forumTitle;
    const titleElement = document.getElementById("chat-title");
    titleElement.textContent = forumTitle;

    const categoryElement = document.createElement('span');
    categoryElement.textContent = ` ${category}`;
    categoryElement.classList.add("forum-list-item-category");
    categoryElement.classList.add(`category-${category}`);
    titleElement.appendChild(categoryElement);

    document.getElementById('chatModal').style.display = 'flex';
    await initChat(forumTitle);
}
function addForumToList(forumTitle, category) {
    const forumListElement = document.getElementById('forumList');

    const newForum = document.createElement('li');


    const titleSpan = document.createElement('span');
    titleSpan.textContent = forumTitle;
    titleSpan.classList.add('forum-title');

    const categorySpan = document.createElement('span');
    categorySpan.textContent = ` ${category}`;
    categorySpan.classList.add("forum-list-item-category");
    categorySpan.classList.add(`category-${category}`);

    newForum.appendChild(titleSpan);
    newForum.appendChild(categorySpan);

    newForum.addEventListener('click', async function () {
        await initChatModal(forumTitle, category);
    });

    forumListElement.appendChild(newForum);
    document.getElementById('forumModal').style.display = 'none';
}

async function printUserForums() {

    const forumsList = await getUserForum();
    forumsList.forEach(forum => {
        addForumToList(forum.title, forum.category);
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
    const forum = await getForum(searchForum.value);
    addForumToList(forum.title, forum.category);
    searchForum.value = '';
    document.getElementById('searchResults').value = '';

}

async function saveNewForum() {
    const forumTitle = document.getElementById('forumTitle').value;
    const category = document.getElementById('ForumCategory').value;
    await createForum(forumTitle, category);
    await addUserToForum(forumTitle);
    addForumToList(forumTitle, category)
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
    });
    document.getElementById("cancelReply").addEventListener("click", () => {
        document.getElementById("replyPreview").classList.add("hidden");
        document.getElementById("chatInput").removeAttribute("data-reply-to");
        document.getElementById("chatInput").placeholder = "Write a message...";
        replyPreviewData = null;
    });


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