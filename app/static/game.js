// Initializes cheeseList variable which is set to the list of cheeses retrieved from the server on page load.
let cheeseList = [];
function storeCheeseList() {
  cheeseList = getCheeseList();
}

//Entries are name, country, mold, animal, cheese type, continent. DATABASE
let correctChoice = [false, false, false, false, false, false];

//Tracks how many valid guesses have been made.
let resultNum = 1;

//Tracks the index of the cheeselist used in making the guess for generating
//word in the results box from the cheeselist not the user input, as user input
//may have incorrect capitalization.
let cheeseIndex = 0;

//Initializes puzzleNum variable which is set to the day's puzzle ID from the server.
let puzzleNum = -1;

// Initializes a 2-D array for storing the results of the users input. Used for creating
// a string that can be copied by the user to share their results.
var resultArray = new Array(5);
for (var i = 0; i < 6; i++) {
  resultArray[i] = [-1, -1, -1, -1, -1, -1];
}


/**
 * Function stores the results of the user in a 2-D array for use in creating
 * a string that can be copied by the user to share their results.
 */
function attributeChecker() {
  for (let i = 0; i < correctChoice.length -1; i++) {
    if (correctChoice[i] == true) {
      resultArray[resultNum - 1][i] = 1;
    }
    if (correctChoice[i] == false) {
      resultArray[resultNum - 1][i] = 0;
    }
  }
  if (correctChoice[5] == true && correctChoice[1] == false) {
    resultArray[resultNum - 1][1] = 2;
  }
}

/**
 * Triggers event when enter key hit.
 */
function search() {
  if(event.key === 'Enter') {
    entryTest(document.getElementById('cheese-choice').value);        
  }
}

/**
 * Function generates results box. Used both in user interaction and in creating the
 * page for the returning user.
 */
function resultGen(entry) {
  //resultnum starts at 1
  document.getElementById("word-" + resultNum).classList.toggle("active");
  let newEle = document.createElement("p");
  let para = document.createTextNode(entry);
  newEle.appendChild(para);
  document.getElementById("word-" + resultNum).appendChild(newEle);
  if (correctChoice[0] == true) {
    $("#word-" + resultNum).css("border", "2px solid green");
  }
  $("#word-" + resultNum).css("display", "flex").hide().fadeIn("slow");

  //Generates section indicating if country is correct.
  document.getElementById("world-" + resultNum).classList.toggle("active");
  $("#world-" + resultNum).append("<i class='fa fa-globe'></i>");
  if (correctChoice[1] == true) {
    $("#world-" + resultNum + " i").css("color", "green");
  }
  if ((correctChoice[1] == false) && (correctChoice[5] == true)) {
    $("#world-" + resultNum + " i").css("color", "orange");
  }
  $("#world-" + resultNum).css("display", "flex").hide().fadeIn("slow");

  //Generates section indicating if mold content is correct.
  document.getElementById("mold-" + resultNum).classList.toggle("active");
  $("#mold-" + resultNum).append("<i class='fa-solid fa-bacteria'></i>");
  if (correctChoice[2] == true) {
    $("#mold-" + resultNum + " i").css("color", "green");
  }
  $("#mold-" + resultNum).css("display", "flex").hide().fadeIn("slow");

  //Generates section indicating if animal of origin is correct.
  document.getElementById("animal-" + resultNum).classList.toggle("active");
  $("#animal-" + resultNum).append("<i class='fa-solid fa-paw'></i>");
  if (correctChoice[3] == true) {
    $("#animal-" + resultNum + " i").css("color", "green");
  }
  $("#animal-" + resultNum).css("display", "flex").hide().fadeIn("slow");

  //Generates section indicating if type of cheese is correct.
  document.getElementById("type-" + resultNum).classList.toggle("active");
  $("#type-" + resultNum).append("<i class='fas fa-cheese'></i>");
  if (correctChoice[4] == true) {
    $("#type-" + resultNum + " i").css("color", "green");
  }
  $("#type-" + resultNum).css("display", "flex").hide().fadeIn("slow");

  //Increments the result num
  resultNum++;
}


/**
 * Function removes text from the text input box.
 */
function removeText() {
  document.getElementById("cheese-choice").value = "";
}



/**
 * Functions tests if entry is valid entry and performs followup functions.
 */
function entryTest(entry) {
  //Removes the textbox and button when user has had 6 valid guesses.
  
  let validEntry = false;

  for (let i = 0; i < cheeseList.length; i++) {
    if (entry.toLowerCase() == cheeseList[i].toLowerCase()) {
      validEntry = true;
      cheeseIndex = i;
      entry = cheeseList[i];
    }
  }
  

  if (validEntry == false) {
    toggleInvalid();
  }

  if (validEntry == true) {
    userPlayed(entry);
    correctChoice = sendCheese(entry);
    removeText();
    // Makes an array that contains boolean for if the attributes of your guessec cheese are correct.
    attributeChecker();
    if (correctChoice[0] == true) {
      $("#guess-textbox").fadeOut("slow");
      $("#guess-button").fadeOut("slow");
      toggleCongrats();
      $("#correct-cheese-container").css("display", "flex").hide().fadeIn("slow");
      $("#share-button").css("display", "flex").hide().fadeIn("slow");
      userSucceeded();
    }
    $("#result-" + resultNum).fadeOut(500);
    // Mutates page based on results from guess.
    setTimeout(resultGen(entry), 500);
    
    
  }

  if (localStorage.getItem("puzzleState") == 'fail') {
    //Uncomment when getanswer works. Will change html of reveal to correct cheese.
    //getAnswer();
    toggleFail();
    $("#guess-textbox").fadeOut("slow");
    $("#guess-button").fadeOut("slow");
    $("#share-button").css("display", "flex").hide().fadeIn("slow");
    $("#correct-cheese-container").css("display", "flex").hide().fadeIn("slow");
    userFailed();
  }
}


/**
 * Generates a popup box when the user does not enter a valid cheese.
 */
function toggleInvalid() {
  document.getElementById("invalid-pop").classList.toggle("active");
}

/**
 * Generates popupbox for help and stats button.
 */
function toggleHelp() {
  document.getElementById("popup-2").classList.toggle("active");
}

function toggleStats() {
  document.getElementById("popup-3").classList.toggle("active");
}

/**
 * Generates a bad luck pop up
 */
function toggleFail() {
  document.getElementById("fail-pop").classList.toggle("active");
}

/**
 * Generates popup box for when the user completes the puzzle.
 */
function toggleCongrats() {
  document.getElementById("congrats-pop").classList.toggle("active");
}

/**
 * Copies result to clipboard when share button is pressed.
 */
function clipboard() {
  let text = "";
  for (let i = 0; i < resultArray.length; i++) {
    for (let j = 0; j < resultArray[i].length; j++) {
      if (resultArray[i][j] == -1) {
        continue;
      }
      if (resultArray[i][j] == 2) {
        let x = "🟧";
        text = text.concat(x);
        continue;
      }
      if (resultArray[i][j] == 0) {
        let x = "🟥";
        text = text.concat(x);
        continue;
      }
      if (resultArray[i][j] == 1) {
        let x = "🟩";
        text = text.concat(x);
        continue;
      }
    }
    text = text.concat("\n");
  }
  let totalGuesses = resultNum - 1;
  if (localStorage.getItem("puzzleState") == 'fail') {
    totalGuesses = 'X';
  }
  text = `Curdle #${puzzleNum} ${totalGuesses}/6\n${text}`;
  navigator.clipboard.writeText(text);
  alert("Copied the text: " + text);
}


// AJAX form.

function sendCheese(entry) {
  let response
  $.ajax({
    type: "POST",
    async: false,
    url: '/check-guess',
    contentType: "application/json",
    dataType: "json",
    data: JSON.stringify({
      cheese_name: entry,
    }),
    success: function (data, status, xhr) { response=data;}
  });
  
  // Pushes the JSON array into a usable correctly ordered array for use in
  // JS functions.
  let result_arranged = [];
  result_arranged.push(response.name)
  result_arranged.push(response.country)
  result_arranged.push(response.mould)
  result_arranged.push(response.animal)
  result_arranged.push(response.type)
  result_arranged.push(response.continent)

  return result_arranged;
}

/**
 * Function toggles the help page to appear.
 */
function toggleHelp() {
  document.getElementById("help-page").classList.toggle("active");
  $("#grid-container-e1").css("display", "grid").hide().fadeIn("slow");
  $("#grid-container-e2").css("display", "grid").hide().fadeIn("slow");
  $("#grid-container-e3").css("display", "grid").hide().fadeIn("slow");
}

/**
 * Retrieves the list of possible cheeses from the server.
 * @returns list of possible cheeses.
 */
function getCheeseList() {
  let response
  $.ajax({
    type: "POST",
    async: false,
    url: '/get-cheeses',
    dataType: "json",
    success: function (data, status, xhr) { response=data;}
  });
  let cheeseList = Object.values(response);
  return cheeseList;
}

/**
 * Function sets the stats in the stats page from data retrieved in the local
 * storage. Typically called when stats are changed.
 */
function setStats() {
  $("#played_text").html(localStorage.getItem("played"));
  $("#winrate_text").html(Math.round(parseInt(localStorage.getItem("winrate"))) + "%");
  $("#streak_text").html(localStorage.getItem("streak"));
  $("#best_text").html(localStorage.getItem("best-streak"));

  let guessDist = localStorage.getItem("guess-distribution").split(',');
  let guessDistInt = [];
  for (let i = 0; i < guessDist.length; i ++) {
    guessDistInt.push(parseInt(guessDist[i]));
  }
  let maxDist = Math.max.apply(Math, guessDistInt);
  let width;
  for (let i = 0; i < guessDistInt.length; i ++) {
    if (maxDist == 0) {
      width = 0
    } else {
      width = (guessDistInt[i] / maxDist) * 100;
    }
    $("#bar" + (i + 1)).css("width", width + "%")
    $("#bar" + (i + 1) + " p").html(guessDistInt[i])
  }
}

/**
 * Function retrieves the day's puzzle id. Used in tracking stats.
 */
function getPuzzleID() {
  let response
  $.ajax({
    type: "POST",
    async: false,
    url: '/puzzle-id',
    dataType: "json",
    success: function (data, status, xhr) { response=data;}
  });
  let puzzleData = Object.values(response);
  puzzleID = puzzleData[1];
  console.log(puzzleID);
  puzzleNum = puzzleID;
}

/**
 * Function retrieves the answer to the puzzle. Revealed to users if they fail to guess.
 */
function getAnswer() {
  let response
  $.ajax({
    type: "POST",
    async: false,
    url: '/get-answer',
    dataType: "json",
    success: function (data, status, xhr) { response=data;}
  });
  let answer = Object.values(response);
  
  $("#correct-cheese p").html(answer);
  console.log(answer);
}