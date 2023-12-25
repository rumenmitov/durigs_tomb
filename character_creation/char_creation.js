let selectButton;
let selectedChar;
let characterOptions;
let heroType;
let nextCharButton;
let prevCharButton;
let knightDescriptionPrompt;
let archerDescriptionPrompt;
let wizardDescriptionPrompt;
let warriorPrincessDescriptionPrompt;
let infoImgClass;
let shieldInfo;
let tripleShotInfo;
let wildfireInfo;
let goddessInfo;
let gameMode = sessionStorage.getItem("gameMode");

window.onload = () => {

    selectButton = document.querySelector("#selectButton");
    characterOptions = document.querySelectorAll(".char_option");
    nextCharButton = document.querySelector("#nextChar");
    prevCharButton = document.querySelector("#prevChar");
    knightDescriptionPrompt = document.querySelector("#knightDescription");
    characterOptions[0].setAttribute("id", "selected");
    archerDescriptionPrompt = document.querySelector("#archerDescription");
    wizardDescriptionPrompt = document.querySelector("#wizardDescription");
    warriorPrincessDescriptionPrompt = document.querySelector("#warriorPrincessDescription");
    infoImgClass = document.querySelectorAll(".infoImg");
    shieldInfo = document.querySelector("#shieldInfo");
    tripleShotInfo = document.querySelector("#tripleShotInfo");
    wildfireInfo = document.querySelector("#wildfireInfo");
    goddessInfo = document.querySelector("#goddessInfo");

    selectedChar = document.querySelector("#selected");
    updateCharInfo();

    selectButton.onclick = () => {        
        heroType = getHeroType();
        sessionStorage.setItem("heroType", heroType);
        location.href = `../${gameMode}/${gameMode}.html`;
    };

    for ( let index in characterOptions) {
        characterOptions[index].onclick = () => {
            selectedChar.removeAttribute("id");
            characterOptions[index].setAttribute("id", "selected");
            selectedChar = document.querySelector("#selected");
            updateCharInfo();
        };
    }

    nextCharButton.onclick = () => {
        let currentlySelected = selectedChar;
        selectedChar.removeAttribute("id");
        for ( let index in characterOptions) {
            if (characterOptions[index] === currentlySelected) {
                index++;
                if (index == 4) {
                    index = 0;
                }
                characterOptions[index].setAttribute("id", "selected");
                selectedChar = document.querySelector("#selected");
                updateCharInfo();
                return;
            }
        }
    };

    prevCharButton.onclick = () => {
        let currentlySelected = selectedChar;
        selectedChar.removeAttribute("id");
        for ( let index in characterOptions) {
            if (characterOptions[index] === currentlySelected) {
                index--;
                if (index == -1) {
                    index = 3;
                }
                characterOptions[index].setAttribute("id", "selected");
                selectedChar = document.querySelector("#selected");
                updateCharInfo();
                return;
            }
        }
    };

    for ( let index in infoImgClass) {
        infoImgClass[index].addEventListener('mouseover', displayAbilityInfo);
        infoImgClass[index].addEventListener('mouseout', hideAbilityInfo);
    }
};

let getHeroType = function() {
    let heroTypeId = selectedChar.children[0].getAttribute("id");
    if (heroTypeId === "knight") {
        return 1;
    } else if (heroTypeId === "archer") {
        return 2;
    } else if (heroTypeId === "wizard") {
        return 3;
    } else if (heroTypeId === "warriorPrincess") {
        return 4;
    }
};

function updateCharInfo() {
    let heroTypeId = selectedChar.children[0].getAttribute("id");
    if (heroTypeId === "knight") {
        knightDescriptionPrompt.setAttribute("class", "show");
        archerDescriptionPrompt.setAttribute("class", "hidden");
        wizardDescriptionPrompt.setAttribute("class", "hidden");
        warriorPrincessDescriptionPrompt.setAttribute("class", "hidden");
    } else if (heroTypeId === "archer") {
        knightDescriptionPrompt.setAttribute("class", "hidden");
        archerDescriptionPrompt.setAttribute("class", "show");
        wizardDescriptionPrompt.setAttribute("class", "hidden");
        warriorPrincessDescriptionPrompt.setAttribute("class", "hidden");
    } else if (heroTypeId === "wizard") {
        knightDescriptionPrompt.setAttribute("class", "hidden");
        archerDescriptionPrompt.setAttribute("class", "hidden");
        wizardDescriptionPrompt.setAttribute("class", "show");
        warriorPrincessDescriptionPrompt.setAttribute("class", "hidden");
    } else if (heroTypeId === "warriorPrincess") {
        knightDescriptionPrompt.setAttribute("class", "hidden");
        archerDescriptionPrompt.setAttribute("class", "hidden");
        wizardDescriptionPrompt.setAttribute("class", "hidden");
        warriorPrincessDescriptionPrompt.setAttribute("class", "show");
    }
}

let displayAbilityInfo = function() {
    let heroTypeId = selectedChar.children[0].getAttribute("id");

    if (heroTypeId === 'knight') {
        shieldInfo.setAttribute("class", "show");
        tripleShotInfo.setAttribute("class", "hidden");
        wildfireInfo.setAttribute("class", "hidden");
        goddessInfo.setAttribute("class", "hidden");
    } else if (heroTypeId === "archer") {
        shieldInfo.setAttribute("class", "hidden");
        tripleShotInfo.setAttribute("class", "show");
        wildfireInfo.setAttribute("class", "hidden");
        goddessInfo.setAttribute("class", "hidden");
    } else if (heroTypeId === "wizard") {
        shieldInfo.setAttribute("class", "hidden");
        tripleShotInfo.setAttribute("class", "hidden");
        wildfireInfo.setAttribute("class", "show");
        goddessInfo.setAttribute("class", "hidden");
    } else if (heroTypeId === "warriorPrincess") {
        shieldInfo.setAttribute("class", "hidden");
        tripleShotInfo.setAttribute("class", "hidden");
        wildfireInfo.setAttribute("class", "hidden");
        goddessInfo.setAttribute("class", "show");
    }
}

let hideAbilityInfo = function() {
    shieldInfo.setAttribute("class", "hidden");
    tripleShotInfo.setAttribute("class", "hidden");
    wildfireInfo.setAttribute("class", "hidden");
    goddessInfo.setAttribute("class", "hidden");
}