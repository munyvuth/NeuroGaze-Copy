export let jsPsych = initJsPsych({
  extensions: [{ type: jsPsychExtensionWebgazer }],
});


export let camera_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
        <p>In order to participate you must allow the experiment to use your camera.</p>
        <p>You will be prompted to do this on the next screen.</p>
        <p>If you do not wish to allow use of your camera, you cannot participate in this experiment.<p>
        <p>It may take up to 30 seconds for the camera to initialize after you give permission.</p>
      `,
  choices: ["Got it"],
};

export let init_camera = {
  type: jsPsychWebgazerInitCamera,
};

export let calibration_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
        <p>Now you'll calibrate the eye tracking, so that the software can use the image of your eyes to predict where you are looking.</p>
        <p>You'll see a series of dots appear on the screen. Look at each dot and click on it.</p>
      `,
  choices: ["Got it"],
};

export let calibration = {
  type: jsPsychWebgazerCalibrate,
  calibration_points: [
    [25, 25],
    [75, 25],
    [50, 50],
    [25, 75],
    [75, 75],
  ],
  repetitions_per_point: 2,
  randomize_calibration_order: true,
};

export let validation_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
        <p>Now we'll measure the accuracy of the calibration.</p>
        <p>Look at each dot as it appears on the screen.</p>
        <p style="font-weight: bold;">You do not need to click on the dots this time.</p>
      `,
  choices: ["Got it"],
  post_trial_gap: 1000,
};

export let validation = {
  type: jsPsychWebgazerValidate,
  validation_points: [
    [25, 25],
    [75, 25],
    [50, 50],
    [25, 75],
    [75, 75],
  ],
  roi_radius: 200,
  time_to_saccade: 1000,
  validation_duration: 2000,
  data: {
    task: "validate",
  },
};

export let recalibrate_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
        <p>The accuracy of the calibration is a little lower than we'd like.</p>
        <p>Let's try calibrating one more time.</p>
        <p>On the next screen, look at the dots and click on them.<p>
      `,
  choices: ["OK"],
};

export let recalibrate = {
  timeline: [
    recalibrate_instructions,
    calibration,
    validation_instructions,
    validation,
  ],
  conditional_function: function () {
    var validation_data = jsPsych.data
      .get()
      .filter({ task: "validate" })
      .values()[0];
    return validation_data.percent_in_roi.some(function (x) {
      var minimum_percent_acceptable = 75;
      return x < minimum_percent_acceptable;
    });
  },
  data: {
    phase: "recalibration",
  },
};
