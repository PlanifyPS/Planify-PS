import {
    getAllDocumentsFromCollection,
    getForum, getForumMessagesFromFirebase,
    getUserData,
    initForum,
    saveForumUser,
    saveUserData, sendForumMessage
} from "./firestore_utils.js";





export async function getUserForum() {

    const userData = await getUserData(sessionStorage.getItem("uid"));
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
    updatedForum.push(sessionStorage.getItem("uid"));


    await saveForumUser(forumUid, {users: updatedForum});
}

export async function addUserToForum(forumName) {

    if(!await checkIfForumExists(forumName)){return;}

    const userData = await getUserData(sessionStorage.getItem("uid"));
    const userFormData = [];
    for(const index in userData.forum || []) {
        userFormData.push(userData.forum[index])
    }
    userFormData.push(forumName);
    await saveUserData(sessionStorage.getItem("uid"), {forum: userFormData});
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
        return !forum.users.includes(sessionStorage.getItem("uid"));
    });


}
export async function sendMessage(forumId, messageBody){
    await sendForumMessage(forumId, sessionStorage.getItem("uid"), messageBody, sessionStorage.getItem("userName"));
}

export async function getForumMessages(forumId){

    const forumData = await getForumMessagesFromFirebase(forumId);
    const messages = [];
    forumData.forEach(doc => {
        const data = doc.data();
        messages.push({
            id: doc.id,
            ...data,
            senderName: data.sender === sessionStorage.getItem("uid") ? "You" : data.senderName,

        });
    });

    return messages;
    
}