const overlay = document.querySelector('.overlay');
if (overlay) {
    const randomImageNumber = Math.floor(Math.random() * 6) + 1;
    overlay.style.background = `var(--light-blue) url("./assets/register${randomImageNumber}.jpg") no-repeat fixed center`;
    overlay.style.backgroundSize = "cover";
    overlay.style.backgroundPosition = "center center";
}

const registerMain = document.getElementById('register');
if (registerMain) {

    const logInBtn = document.getElementById("logIn");
    const signUpBtn = document.getElementById("signUp");
    const container = document.querySelector(".container");

    logInBtn.addEventListener("click", () => {
        container.classList.remove("right-panel-active");
    });

    signUpBtn.addEventListener("click", () => {
        container.classList.add("right-panel-active");
    });

    const switchToLoginBtn = document.getElementById("switchToLogin");
    const switchToSignUpBtn = document.getElementById("switchToSignUp");

    switchToLoginBtn.addEventListener("click", () => {
        container.classList.remove("right-panel-active");
    });

    switchToSignUpBtn.addEventListener("click", () => {
        container.classList.add("right-panel-active");
    });
}