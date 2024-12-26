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

// constant for API Key
const API_KEY = "wxFE-eV4eaT1N27OsKq5N8Kt9riF36G9Dy_KSPZenqQ";
// value for test time duration in seconds
const TEST_DURATION = 30;
const DELAY_INTERVAL = [1000, 2000, 4000];

let images = []; // images array
let randImgIndex; // randomly selected image index
let currImgIndex = 0; // current image index
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
      showRandomImage(); // call random image function
    },
    on_finish: function () {
      console.log("Finished");
      let eyeTrackingData = jsPsych.data.getLastTrialData().values();
      let trial_json = JSON.stringify(eyeTrackingData, null, 2);
      console.log("Eye Tracking Data:", trial_json);
      localStorage.setItem("attention-eyeTracking", JSON.stringify(trial_json));
      endTest();
    },
    trial_duration: TEST_DURATION * 1000,
    extensions: [
      {
        type: jsPsychExtensionWebgazer,
        params: { targets: ["#currentImg"] },
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
 * Fetches 10 random images from the Unsplash API.
 */
async function fetchImageURLs() {
  const URL = `https://api.unsplash.com/photos/random?count=10&client_id=${API_KEY}`;
  const response = await fetch(URL);
  const data = await response.json();
  const imgUrls = data.map((img) => img.urls.regular);

  return imgUrls;
}

/**
 * Show the instruction at the start up screen.
 */
function showCalibrationInstructions() {
  HTML = document.getElementById("imgCont").outerHTML;
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
    title: "ADHD Visual Attention Test",
    text: "The computer will generate 10 random images. It will pick one image which you will need to press the spacebar when you see. Do not press the spacebar if a different image appears.",
    icon: "info",
    button: "Next",
    closeOnClickOutside: false,
  }).then((isConfirm) => {
    if (isConfirm) {
      console.log("Pressed confirm");
      startingTestInstructions(done);
    }
  });
}

/**
 * This is instructions for the selected image.
 */
async function startingTestInstructions(done) {
  images = await fetchImageURLs(); // Array of 10 images
  // Set randImgIndex to one of the images randomly
  randImgIndex = Math.floor(Math.random() * images.length);
  console.log(randImgIndex, images[randImgIndex]);

  swal({
    title: "Your Image",
    text: "This is the image. Make sure to press the spacebar when you see it again.",
    icon: images[randImgIndex],
    closeOnClickOutside: false,
    button: "Start Test",
  }).then((isConfirm) => {
    if (isConfirm) {
      console.log(HTML);
      done();
    }
  });
}

/**
 * Test start
 */
function showRandomImage() {
  if (!testingPhase) return;
  omissionErrorFlag = true;
  startTime = Date.now();
  let currentImage = document.getElementById("currentImg");
  currImgIndex = Math.floor(Math.random() * images.length); // random current index
  currentImage.src = images[currImgIndex]; // set currentImage.src to random current index inside images array

  let delay = DELAY_INTERVAL[Math.floor(Math.random() * 3)];

  setTimeout(checkOmissionError, 250 + delay);
  setTimeout(showRandomImage, 250 + delay);
}

/**
 * Check Omission Error Flag
 */
function checkOmissionError() {
  if (omissionErrorFlag && currImgIndex == randImgIndex) {
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
    "attention-reactionTimes",
    JSON.stringify(reactionTimes)
  );
  localStorage.setItem("attention-reactionTimes", reactionTimes);
  localStorage.setItem("attention-avgReactionTime", avgReactionTime);
  localStorage.setItem("attention-testScore", testScore);
  localStorage.setItem("attention-omissionErrors", omissionErrors);
  localStorage.setItem("attention-comissionErrors", comissionErrors);

  swal({
    title: "Test Completed",
    icon: "success",
    button: "Start Next Test",
    closeOnClickOutside: false,
  }).then((isConfirm) => {
    if (isConfirm) {
      window.location.href = "continuous-inhibition";
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
    if (randImgIndex == currImgIndex) {
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
