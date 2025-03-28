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