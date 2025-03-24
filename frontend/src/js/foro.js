const forumList = [];
let currentForum = "Nombre del Foro";
const forumPosts = {};

document.getElementById('createForum').addEventListener('click', function() {
    document.getElementById('forumModal').style.display = 'flex';
});

document.getElementById('saveForum').addEventListener('click', function() {
    const forumTitle = document.getElementById('forumTitle').value;
    if (forumTitle) {
        forumList.push(forumTitle);
        forumPosts[forumTitle] = [];
        const forumListElement = document.getElementById('forumList');
        const newForum = document.createElement('li');
        newForum.textContent = forumTitle;
        newForum.addEventListener('click', function() {
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
                });
                resultsContainer.appendChild(resultItem);
            }
        });
    }
});

document.getElementById('addPost').addEventListener('click', function() {
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