import {
    getAllDocumentsFromCollection,
    getForum, getForumMessagesFromFirebase,
    getUserData,
    initForum,
    saveForumUser,
    saveUserData, sendForumMessage
} from "./firestore_utils.js";


const userUID = sessionStorage.getItem("uid");
const userName = sessionStorage.getItem("userName");


export async function getUserForum() {

    const userData = await getUserData(userUID);
    const forums = []
    for(const index in userData.forum) {
        const forumId = userData.forum[index];
        forums.push(await getForum(forumId));
    }
    return forums;
}

async function checkIfForumExists(forumName) {
    const forumData = await getForum(forumName);
    return forumData !== undefined;
}

async function updateForum(forumUid) {

    const forum = await getForum(forumUid);
    const updatedForum = [];
    for(const index in forum.users || []){
        updatedForum.push(forum.users[index]);
    }
    updatedForum.push(userUID);


    await saveForumUser(forumUid, {users: updatedForum});
}

export async function addUserToForum(forumName) {

    if(!await checkIfForumExists(forumName)){return;}

    const userData = await getUserData(userUID);
    const userFormData = [];
    for(const index in userData.forum || []) {
        userFormData.push(userData.forum[index])
    }
    userFormData.push(forumName);
    await saveUserData(userUID, {forum: userFormData});
    await updateForum(forumName);

}

export async function createForum(forumName) {
    const forumInit = {
        messages : {},
        users : [],
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
export async function sendMessage(forumId, messageBody){
    await sendForumMessage(forumId, userUID, messageBody, userName);
}

export async function getForumMessages(forumId){

    const forumData = await getForumMessagesFromFirebase(forumId);
    const messages = [];
    forumData.forEach(doc => {
        const data = doc.data();
        messages.push({
            id: doc.id,
            ...data,
            senderName: data.sender === userUID ? "You" : data.senderName,

        });
    });

    return messages;
    
}