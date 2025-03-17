// JS/register.js
if (document.body.id === 'register') {
    const logInBtn = document.getElementById("logIn");
    const signUpBtn = document.getElementById("signUp");
    const container = document.querySelector(".container");

    logInBtn.addEventListener("click", () => {
        container.classList.remove("right-panel-active");
    });

    signUpBtn.addEventListener("click", () => {
        container.classList.add("right-panel-active");
    });
}