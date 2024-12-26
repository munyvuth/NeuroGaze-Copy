import {
  jsPsych,
  camera_instructions,
  init_camera,
  calibration_instructions,
  calibration,
  validation_instructions,
  validation,
  recalibrate,
} from "./calibration.js";

// value for test time duration in seconds
const TEST_DURATION = 30;
// values of the alphabet
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DELAY_INTERVAL = [1000, 2000, 4000];

let currLetterIndex = 0; // current letter index
let corPressedKeys = 0; // correct pressed keys
let incPressedKeys = 0; // incorrect pressed keys
let omissionErrorFlag = true; // omission error flag
let omissionErrors = 0; // omission errors
let comissionErrors = 0; // comission errors
let testingPhase = false; // boolean test initiated
let reactionTimes = []; // reactionTimes array
let startTime; // exact time and date when correct image appears
let avgReactionTime; // average reaction time
let HTML; // Store the page's HTML content

// Initialize jsPsych
function initJsPsychTimeline() {
  let calibration_done = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
    <p>Great, we're done with calibration!</p>
  `,
    choices: ["OK"],
    on_finish: function () {},
  };

  let trialInstructions = {
    type: jsPsychCallFunction,
    async: true,
    func: function (done) {
      showInitialInstructions(done);
    },
  };

  let trial = {
    type: jsPsychHtmlKeyboardResponse,
    choices: "NO_KEYS",
    stimulus: HTML,
    on_load: function () {
      console.log(HTML);
      console.log("Trial started");
      testingPhase = true; // set testingPhase to true
      showRandomLetter(); // call random image function
    },
    on_finish: function () {
      console.log("Finished");
      let eyeTrackingData = jsPsych.data.getLastTrialData().values();
      let trial_json = JSON.stringify(eyeTrackingData, null, 2);
      console.log("Eye Tracking Data:", trial_json);
      localStorage.setItem(
        "inhibition-eyeTracking",
        JSON.stringify(trial_json)
      );
      endTest();
    },
    trial_duration: TEST_DURATION * 1000,
    extensions: [
      {
        type: jsPsychExtensionWebgazer,
        params: { targets: ["#currentLetter"] },
      },
    ],
  };

  jsPsych.run([
    camera_instructions,
    init_camera,
    calibration_instructions,
    calibration,
    validation_instructions,
    validation,
    recalibrate,
    calibration_done,
    trialInstructions,
    trial,
  ]);
}

/**
 * Show the instruction at the start up screen.
 */
function showCalibrationInstructions() {
  HTML = document.getElementById("letterCont").outerHTML;
  console.log(HTML);

  swal({
    title: "Pre-Test Calibration",
    text: "You will calibrate the eye tracker before the test starts.",
    icon: "info",
    button: "Begin",
    
    closeOnClickOutside: false,
  }).then((isConfirm) => {
    if (isConfirm) {
      initJsPsychTimeline();
    }
  });
}

/**
 * Show the instruction at the start up screen.
 */
function showInitialInstructions(done) {
  swal({
    title: "Continuous Inhibition Test",
    text: "You will be presented with a series of flashing alphabetical letters on the screen with varying frequencies. Press the spacebar for every letter other than ‘X’.",
    icon: "info",
    button: "Start Test",
    closeOnClickOutside: false,
  }).then((isConfirm) => {
    if (isConfirm) {
      done();
    }
  });
}

/**
 * Test start
 */
function showRandomLetter() {
  if (!testingPhase) return;
  currLetterIndex = Math.floor(Math.random() * 26); // random current index

  startTime = Date.now();
  let currentLetter = document.getElementById("currentLetter");
  console.log("Current Letter:", ALPHABET[currLetterIndex]);
  currentLetter.textContent = ALPHABET[currLetterIndex]; // set current letter text to random letter

  let delay = DELAY_INTERVAL[Math.floor(Math.random() * 3)];
  setTimeout(checkOmissionError, 250 + delay);
  setTimeout(showRandomLetter, 250 + delay);
}

/**
 * Check Omission Error Flag
 */
function checkOmissionError() {
  if (omissionErrorFlag && ALPHABET[currLetterIndex] !== "X") {
    console.log("omission error");
    omissionErrors++;
    incPressedKeys++;
  }
}

/**
 * Ends the test
 */
function endTest() {
  testingPhase = false;
  avgReactionTime = calculateAvgReactionTime();
  let testScore = calculateTestScore();
  console.log(
    "Test ended:",
    avgReactionTime,
    testScore,
    omissionErrors,
    comissionErrors
  );
  localStorage.setItem(
    "inhibition-reactionTimes",
    JSON.stringify(reactionTimes)
  );
  localStorage.setItem("inhibition-reactionTimes", reactionTimes);
  localStorage.setItem("inhibition-avgReactionTime", avgReactionTime);
  localStorage.setItem("inhibition-testScore", testScore);
  localStorage.setItem("inhibition-omissionErrors", omissionErrors);
  localStorage.setItem("inhibition-comissionErrors", comissionErrors);

  swal({
    title: "Test Completed",
    icon: "success",
    button: "Start Next Test",
    closeOnClickOutside: false,
  }).then((isConfirm) => {
    if (isConfirm) {
      window.location.href = "interference";
    }
  });
}

/**
 * Calculate reaction times
 */
function calculateAvgReactionTime() {
  let sum = 0;
  for (let i = 0; i < reactionTimes.length; i++) {
    sum += reactionTimes[i];
  }
  return sum / reactionTimes.length;
}

/**
 * Calculate final test score
 */
function calculateTestScore() {
  return (corPressedKeys / (corPressedKeys + incPressedKeys)) * 100;
}

/**
 * Event listener for keypress event
 */
document.addEventListener("keypress", function (event) {
  if (testingPhase && event.code === "Space") {
    if (ALPHABET[currLetterIndex] !== "X") {
      let endTime = Date.now();
      let reactionTime = endTime - startTime;
      reactionTimes.push(reactionTime);
      corPressedKeys++;
      omissionErrorFlag = false;
      console.log("correct press");
    } else {
      console.log("incorrect press");
      incPressedKeys++;
      comissionErrors++;
    }
  }
});

showCalibrationInstructions();
