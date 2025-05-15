import {
    checkIfMessageLiked,
    getAllDocumentsFromCollection,
    getForum, getForumMessagesFromFirebase,
    getUserData,
    initForum,
    saveForumUser,
    saveUserData, sendForumMessage
} from "./firestore_utils.js";
import {collection, onSnapshot, orderBy, query} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import {db} from "./firebase_config.js";





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

export async function createForum(forumName, category) {
    const forumInit = {
        messages : {},
        users : [],
        title : forumName,
        category: category,
    }
    await initForum(forumName,forumInit);


}

export async function getAllForumsAvoidingUserForum(){

    const forumList = await getAllDocumentsFromCollection("Forums");

    return forumList.filter((forum) => {
        return !forum.users.includes(sessionStorage.getItem("uid"));
    });


}
export async function sendMessage(forumId, messageBody, replyToMessageId = null){
   return  await sendForumMessage(forumId, sessionStorage.getItem("uid"), messageBody, sessionStorage.getItem("userName"), replyToMessageId);
}

export function subscribeToForumMessagesIncremental(forumId, onInitial, onNew) {
    const messagesRef = collection(db, "Forums", forumId, "messages");
    const q = query(messagesRef, orderBy("timestamp"));
    let firstLoad = true;

    
    const allMessages = [];

    const unsubscribe = onSnapshot(q, async snapshot => {
        if (firstLoad) {

            const allMessagesToEnriched = await Promise.all(
                snapshot.docs.map(async doc => {
                    const data = doc.data();
                    const isLiked = await checkIfMessageLiked(forumId, doc.id, sessionStorage.getItem("uid"));
                    return { id: doc.id,
                        ...data, 
                        isLiked,
                        senderName:data.senderName === sessionStorage.getItem("userName") ? "You" : data.senderName,
                        };
                })
            );

            allMessagesToEnriched.forEach(msg => {
                const original = allMessagesToEnriched.find(m => m.id === msg.replyTo);
                msg.replyPreview = original
                    ? { senderName: original.senderName, body: original.body }
                    : null;
            });

            allMessages.push(...allMessagesToEnriched);
            await onInitial(allMessagesToEnriched);
            firstLoad = false;
        } else {

            const added = snapshot.docChanges()
                .filter(c => c.type === "added")
                .map(c => c.doc);

            if (added.length) {
                const newMessagesToEnriched = await Promise.all(
                    added.map(async doc => {
                        const messageData = doc.data();
                        const isLiked = await checkIfMessageLiked(forumId, doc.id, sessionStorage.getItem("uid"));
                        return { id: doc.id,
                            ...messageData,
                            isLiked,
                            senderName:messageData.senderName === sessionStorage.getItem("userName") ? "You" : messageData.senderName,
                            };
                    })
                );

                newMessagesToEnriched.forEach(msg => {
                    const original = allMessages.find(m => m.id === msg.replyTo);
                    msg.replyPreview = original
                        ? { senderName: original.senderName, body: original.body }
                        : null;
                });

                allMessages.push(...newMessagesToEnriched);
                await onNew(newMessagesToEnriched);
            }
        }
    }, err => console.error("Realtime messages error:", err));

    return unsubscribe;
}