
let boxes = document.querySelectorAll(".box");
let reset = document.querySelector("#reset");
let newgame= document.querySelector("#newgame");
let finalmessage = document.querySelector(".final_message");
let msg = document.querySelector("#msg");

let turn_O = true; // Player O

const winning_Patterns = [
    [0,1,2],
    [0,3,6],
    [0,4,8],
    [1,4,7],
    [2,5,8],
    [2,4,6],
    [3,4,5],
    [6,7,8]
];


boxes.forEach((box) => {
    box.addEventListener("click", () => {
        console.log("Box was Clicked");
        if( turn_O ){
            box.innerText = "O";
            turn_O =false;
            box.style.color = "blue";
        }
        else{
            box.innerText = "X";
            turn_O = true;
            box.style.color = "red";
        }
        box.disabled =true; //Donot allow to enter multiple values fro same box
   checkWinner();
 });
    
});

const resetbtn= () =>{
    turn_O = true;
    enable_boxes();
    finalmessage.classList.add("hide");
}
const disable_btns = () =>{
    for( box of boxes){
        box.disabled = true;
    }
}

const enable_boxes = () =>{
    for(let box of boxes){
        box.disabled = false;
        box.innerText= "";
    }

}


const showWinner = (winner) =>{
    msg.innerText= `Congratulations the Winner is ${winner}`;
    finalmessage.classList.remove("hide");
}

const checkWinner = () =>{
    for (let pattern of winning_Patterns){

    let posval1 = boxes[pattern[0]].innerText;
    let posval2 = boxes[pattern[1]].innerText;
    let posval3 = boxes[pattern[2]].innerText;

    if(posval1 != "" && posval2 != "" && posval3 != ""){ //All positions should be filled ,no empty boxes,blanks.
        if(posval1 === posval2 && posval2 === posval3){
            console.log("Winner");
        showWinner(posval1);
        disable_btns();

    }

    }
};

}

newgame.addEventListener("click",resetbtn);
reset.addEventListener("click",resetbtn);