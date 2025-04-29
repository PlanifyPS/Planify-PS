import {getAllDocumentsFromCollection, getForum, getUserData, initForum, saveUserData} from "./firestore_utils.js";


const userUID = sessionStorage.getItem("uid");


export async function getUserForum() {

    const userData = await getUserData(userUID);
    const forums = []
    for(const index in userData.forum) {
        const forumId = userData.forum[index];
        forums.push(await getForum(forumId));
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
        users : [userUID],
        title : forumName,
    }
    await initForum(forumName,forumInit);

}

export async function getAllForumsAvoidingUserForum(){

    const forumList = await getAllDocumentsFromCollection("Forums");

    return forumList.filter((forum) => {
        return !forum.users.includes(userUID);
    });


}