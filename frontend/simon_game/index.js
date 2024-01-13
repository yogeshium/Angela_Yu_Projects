var gamePattern = [];
var userClickedPattern=[];
var colorPointer=-1;
var buttonColors=["red","blue","green","yellow"];
var level=-1;

function playSound(color)
{
    $("#"+color+" audio")[0].play();
}

function nextSequence()
{
    //Increase level
    level++;
    //show level at h1
    $("h1").text("Level "+level);
    //generate random color
    let x= Math.floor(Math.random()*4);
    gamePattern.push(buttonColors[x]);
    //Empty the userClickedPattern
    userClickedPattern=[];colorPointer=-1;
    //animating color that generated
    $("#"+buttonColors[x]).fadeOut(100).fadeIn(100);
    playSound(buttonColors[x]);

    
    return x;
}

function animatePress(color)
{
    $("#"+color).addClass("pressed");
    setTimeout(function(){
        $("#"+color).removeClass("pressed");
    },100);

}
function gameOver()
{
    //GameOver effects
    $("h1").text("Game Over, Press Any Key to Restart");
    playSound("wrong");
    $("body").addClass("game-over");
    setTimeout(function(){
        $("body").removeClass("game-over");
    },200);

    //Restart Effects
    level=-1;
    gamePattern=[];
    userClickedPattern=[];
}

//Adding Audio file in html
for(let i=0;i<buttonColors.length;i++)
{
    $("#"+buttonColors[i]).append("<audio></audio>");
    $("#"+buttonColors[i]+" audio").append("<source src='sounds/"+ buttonColors[i] +".mp3'>");
}
$(".container").append("<div id='wrong'></div>");
$("#wrong").append("<audio></audio>");
$("#wrong audio").append("<source src='sounds/wrong.mp3'>");

//on click on colors
$(".btn").click(function(event){
    //Adding sound and animation
    let userChosenColor=event.target.id;
    playSound(userChosenColor);
    animatePress(userChosenColor);

    //Storing user picked color
    userClickedPattern.push(userChosenColor);
    colorPointer++;

    //Check pattern
    if(gamePattern.length===0)
    {
        console.log("game over called");
        gameOver();
    }
    else
    {
        if(userClickedPattern[colorPointer]===gamePattern[colorPointer])
        {
            if(colorPointer===gamePattern.length-1)
            {
                setTimeout(nextSequence,1000);
            }
        }
        else
        {
            gameOver();
        }
    }
});

//Press key to start game
$("body").keypress(function(){
    if(level===-1)
        nextSequence();
});

