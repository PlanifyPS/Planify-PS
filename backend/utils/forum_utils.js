import {getForum, getUserData, initForum, saveUserData} from "./firestore_utils.js";


const userUID = sessionStorage.getItem("uid");


export async function getUserForum() {

    const userData = await getUserData(userUID);
    const forums = []
    for(const index in userData.forum) {
        const forumid = userData.forum[index];
        forums.push(await getForum(forumid));
    }
    return forums;
}

export async function addUserToForum(forumName) {

    const userData = await getUserData(userUID);
    const userFormData = [];
    for(const index in userData.forum || []) {
        userFormData.push(userData.forum[index])
    }
    userFormData.push(forumName);
    await saveUserData(userUID, {forum: userFormData});

}

export async function createForum(forumName) {
    const forumInit = {
        messages : {},
        users : [userUID]
    }
    await initForum(forumName,forumInit);


}