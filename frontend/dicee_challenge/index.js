let box1 = document.querySelector(".dice .img1");
let box2 = document.querySelector(".dice .img2");

let randomNumber1=Math.floor((Math.random()*6)+1);
let randomNumber2=Math.floor((Math.random()*6)+1);

box1.setAttribute("src",`images/dice${randomNumber1}.png`);
box2.setAttribute("src",`images/dice${randomNumber2}.png`);

let winner = document.querySelector(".container h1");
if(randomNumber1>randomNumber2)
    winner.innerHTML="🚩 Player1 wins";
else if(randomNumber1<randomNumber2)
    winner.innerHTML = "Player2 wins 🚩";
else
    winner.innerHTML = "Draw!";