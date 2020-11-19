// mujtabachang: Timer handling Script

// mujtabachang: Global variables
var timerRunning = false;
var timerMinutes = 0;
var timerSeconds = 0;
var timerUp = false;

var timerTextElement;
var timerSettingsElement;
var timerMessageElement;

// mujtabachang: Button handler function
function runTimerButton ()
{
  // mujtabachang: Get the timer value from the input and sanitize it
 var inputTimerValue = document.getElementById('timerInput').value.trim();

 // mujtabachang: If no value or there is no separator then set it to some default timer value
 if (inputTimerValue == "" || !inputTimerValue.includes(":")) {
   inputTimerValue = "19:51";
 }

 // mujtabachang: String parsing and converting it positive numbers
 timerSeconds = Math.abs(inputTimerValue.split(":")[1]);
 timerMinutes = Math.abs(inputTimerValue.split(":")[0]);

 // mujtabachang: Limit minutes and seconds to 59
 if (timerMinutes > 59) timerMinutes = 59;
 if (timerSeconds > 59) timerSeconds = 59;


 // mujtabachang: If there are no numbers then set to some values
 if (Number.isNaN(timerMinutes)) timerMinutes = 0;
 if (Number.isNaN(timerSeconds)) timerSeconds = 59;

// mujtabachang: Start the timer and display the current minutes and seconds
 timerRunning = true;
 displayTimer();

// mujtabachang: Hide and show the corresponding divs
 timerSettingsElement.style.display = "none";
 timerTextElement.style.display = "block";

// mujtabachang: If someone has set to 00:00 then end the timer and disable the graph (diagram)
 if (timerSeconds<=0 && timerMinutes<=0)
 {
   timerRunning = false;
   timerUp = true;
   disableGraph();
 }

}

// mujtabachang: initialization of the Timer script
function initTimer()
{
  // mujtabachang: Get timer elements so that we can manipulate them in the code later
  timerTextElement = document.getElementById("timerText");
  timerSettingsElement = document.getElementById("timerSettings");
  timerMessageElement = document.getElementById("timerOut");

  // mujtabachang: Attach the button handler function
  document.getElementById('timerButton').addEventListener('click', runTimerButton);

  // mujtabachang: Counter function which deducts the time, called every 1 sec
  setInterval (timerCount, 1000);
}

// mujtabachang: This function is called every 1 sec to deal with timer deduction
function timerCount ()
{

  // mujtabachang: If the timer has already run out then display the message if not already displayed
  if (timerUp)
  {
    timerMessageElement.style.display = "flex";
  }

  // mujtabachang: If there is no timer running, then quit the function
  if (!timerRunning) { return;}

  // mujtabachang: Deduct 1 second
  timerSeconds = timerSeconds - 1;

  // mujtabachang: Deduct 1 min if seconds run out
  if (timerSeconds < 0 )
  {
    timerSeconds = 59;
    timerMinutes = timerMinutes - 1;
  }

  // mujtabachang: Detect if the timer has run out, then update variables and display accordingly
  if (timerSeconds <= 0 && timerMinutes <= 0)
  {
    timerRunning = false;
    timerUp = true;
    timerSeconds = 0;
    timerMinutes = 0;
    timerMessageElement.style.display = "flex";
    displayTimer();
    disableGraph();
    return;
  }

  // mujtabachang: Display the timer value
  displayTimer();

}

// mujtabachang: Function to format and display the timer values to the div timer
function displayTimer()
{
  timerTextElement.innerHTML = "<h1>" + ('0' + timerMinutes).slice(-2)  + ":" + ('0' + timerSeconds).slice(-2) +  "</h1>";
}

// mujtabachang: This function changes the GoJS diagram's Enabled property to false to disable it
function disableGraph()
{
  myDiagram.isEnabled= false;
}

// mujtabachang: Load the initTimer when the page loads
initTimer();
