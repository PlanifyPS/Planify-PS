import {
    addUserToForum,
    createForum,
    getAllForumsAvoidingUserForum,
    getUserForum
} from "../../../backend/utils/forum_utils.js";

const forumList = [];
let currentForum = "Forum Name";
const forumPosts = {};

function addForumToList(forumTitle) {


    const forumListElement = document.getElementById('forumList');
    const newForum = document.createElement('li');
    newForum.textContent = forumTitle;
    newForum.addEventListener('click', function () {
        document.getElementById('forumName').textContent = forumTitle;
        document.getElementById('forumContainer').innerHTML = '';
        currentForum = forumTitle;
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
    searchForum.value = '';
}

async function setupForumListeners() {
    document.getElementById('searchForum').addEventListener('input', autoCompleteForums);
    document.getElementById('addPost').addEventListener('click', joinForum)
   
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


document.getElementById('createForum').addEventListener('click', async function () {
    document.getElementById('forumModal').style.display = 'flex';
});


document.querySelectorAll('.close').forEach(button => {
    button.addEventListener('click', function() {
        this.closest('.modal').style.display = 'none';
    });
});


document.getElementById('saveForum').addEventListener('click', async function () {
    const forumTitle = document.getElementById('forumTitle').value;
    if (forumTitle) {
        forumList.push(forumTitle);
        forumPosts[forumTitle] = [];
        const forumListElement = document.getElementById('forumList');
        const newForum = document.createElement('li');
        newForum.textContent = forumTitle;
        newForum.addEventListener('click', function () {
            document.getElementById('forumName').textContent = forumTitle;
            document.getElementById('forumContainer').innerHTML = '';
            currentForum = forumTitle;
            forumPosts[currentForum].forEach(post => {
                document.getElementById('forumContainer').appendChild(post.cloneNode(true));
            });
        });
        forumListElement.appendChild(newForum);
        document.getElementById('forumModal').style.display = 'none';
    }
    await createForum(forumTitle);
    await addUserToForum(forumTitle);
});

document.getElementById('searchForum').addEventListener('input', function() {
    const query = this.value.toLowerCase();
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';
    if (query) {
        forumList.forEach(forum => {
            if (forum.toLowerCase().startsWith(query)) {
                const resultItem = document.createElement('div');
                resultItem.textContent = forum;
                resultItem.addEventListener('click', function() {
                    document.getElementById('forumName').textContent = forum;
                    document.getElementById('forumContainer').innerHTML = '';
                    currentForum = forum;
                    forumPosts[currentForum].forEach(post => {
                        document.getElementById('forumContainer').appendChild(post.cloneNode(true));
                    });
                    resultsContainer.innerHTML = '';
                    document.getElementById('searchForum').value = '';
                });
                resultsContainer.appendChild(resultItem);
            }
        });
    }
});


document.getElementById('addPost').addEventListener('click', function() {
    if(currentForum == "Forum Name") {
        alert("Please, enter or create a forum");
        return;
    }
    document.getElementById('postModal').style.display = 'flex';
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
    const searchBox = document.getElementById('searchForum');
    const resultsContainer = document.getElementById('searchResults');
    if (!searchBox.contains(e.target) && !resultsContainer.contains(e.target)) {
        resultsContainer.innerHTML = '';
    }
});

await initHome();