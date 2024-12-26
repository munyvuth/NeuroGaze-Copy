let selectedDifficulty = "";
let questions = [];

function showInitialInstructions() {
  const difficultyOptions = [
    { text: "(For Children 6-11)", value: "child" },
    { text: "(For Teens 12-17)", value: "teen" },
    { text: "(For Adults 18+)", value: "adult" },
  ];

  const select = document.createElement("select");

  difficultyOptions.forEach((option) => {
    const optionElement = document.createElement("option");
    optionElement.text = option.text;
    optionElement.value = option.value;
    select.appendChild(optionElement);
  });

  selectedDifficulty = difficultyOptions[0].value; // Default to first option

  select.onchange = function (e) {
    selectedDifficulty = e.target.value;
  };

  swal({
    title: "Select Difficulty",
    text: "Choose the difficulty level for the screening",
    icon: "info",
    content: select,
    buttons: {
      cancel: "Cancel",
      confirm: "Start Test",
    },
    closeOnClickOutside: false,
  }).then((isConfirm) => {
    if (isConfirm) {
      testingPhase = true;
      showSelectedInstructions(selectedDifficulty);
    }
  });
}

function showSelectedInstructions(selectedDifficulty) {
  let instructions = "";

  switch (selectedDifficulty) {
    case "child":
      instructions =
        "Please have a parent or guardian answer the questions below, rating yourself on each of the criteria. As you answer each question, click on box that best describes how you have felt and conducted yourself over the past 6 months.";
      break;
    case "teen":
      instructions =
        "Please have a parent or guardian answer the questions below, rating yourself on each of the criteria. As you answer each question, click on box that best describes how you have felt and conducted yourself over the past 6 months.";
      break;
    case "adult":
      instructions =
        "Please answer the questions below, rating yourself on each of the criteria. As you answer each question, click on box that best describes how you have felt and conducted yourself over the past 6 months.";
      break;
    default:
      instructions =
        "Please answer the questions below, rating yourself on each of the criteria. As you answer each question, click on box that best describes how you have felt and conducted yourself over the past 6 months.";
      break;
  }

  swal({
    title: "ADHD Screening Test",
    text: instructions,
    icon: "info",
    button: "Start Survey",
    closeOnClickOutside: false,
  }).then((isConfirm) => {
    if (isConfirm) {
      onTestStart(selectedDifficulty);
    }
  });
}

async function onTestStart(selectedDifficulty) {
  const submitButton = document.getElementById("submit");
  try {
    let response = await fetch("/static/testing/questions.json");

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    let data = await response.json();

    // Select questions based on the chosen difficulty
    switch (selectedDifficulty) {
      case "child":
        questions = data.child;
        break;
      case "teen":
        questions = data.teen;
        break;
      case "adult":
        questions = data.adult;
        break;
      default:
        throw new Error("Invalid difficulty selected");
    }

    displayQuestions(selectedDifficulty);
    console.log("Questions loaded:", questions);
  } catch (error) {
    console.error("Error fetching or parsing questions:", error);
  }

  function displayQuestions(difficulty) {
    const questionContainer = document.getElementById(`${difficulty}Questions`);
    console.log("Question Container: ", questionContainer);
    questionContainer.style.display = "block";
    if (!questionContainer) {
      console.error(
        `Question container not found for difficulty: ${difficulty}`
      );
      return;
    }
  }

  function gradeChildTest(questions) {
    let totalAChecked = 0;
    let totalBChecked = 0;
    let totalCChecked = 0;
    let totalDChecked = 0;
    let totalEChecked = 0;
    let performanceChecked = 0;

    let results = {
      predominantlyInattentive: false,
      predominantlyHyperactiveImpulsive: false,
      combinedInattentionHyperactivity: false,
      oppositionalDefiantDisorder: false,
      conductDisorder: false,
      anxietyDeppression: false,
    };

    for (let i = 0; i < 9; i++) {
      let question = document.getElementById("questionCQ" + (i + 1));
      console.log(question);

      let checked = question.querySelector('input[type="radio"]:checked');
      console.log(checked);
      if (checked.value >= 2) {
        totalAChecked++;
      }
    }

    for (let i = 9; i < 18; i++) {
      let question = document.getElementById("questionCQ" + (i + 1));

      let checked = question.querySelector('input[type="radio"]:checked');
      if (checked.value >= 2) {
        totalBChecked++;
      }
    }

    for (let i = 18; i < 26; i++) {
      let question = document.getElementById("questionCQ" + (i + 1));

      let checked = question.querySelector('input[type="radio"]:checked');
      if (checked.value >= 2) {
        totalCChecked++;
      }
    }

    for (let i = 26; i < 40; i++) {
      let question = document.getElementById("questionCQ" + (i + 1));

      let checked = question.querySelector('input[type="radio"]:checked');
      if (checked.value >= 2) {
        totalDChecked++;
      }
    }

    for (let i = 40; i < 47; i++) {
      let question = document.getElementById("questionCQ" + (i + 1));

      let checked = question.querySelector('input[type="radio"]:checked');
      if (checked.value >= 2) {
        totalEChecked++;
      }
    }

    for (let i = 47; i < 55; i++) {
      let question = document.getElementById("questionCQ" + (i + 1));

      let checked = question.querySelector('input[type="radio"]:checked');
      if (checked.value >= 4) {
        performanceChecked++;
      }
    }

    if (totalAChecked >= 6 && performanceChecked > 0) {
      results.predominantlyInattentive = true;
    }

    if (totalBChecked >= 6 && performanceChecked > 0) {
      results.predominantlyHyperactiveImpulsive = true;
    }

    if (
      results.predominantlyInattentive === true &&
      results.predominantlyHyperactiveImpulsive === true
    ) {
      results.combinedInattentionHyperactivity = true;
    }

    if (totalCChecked >= 4 && performanceChecked > 0) {
      results.oppositionalDefiantDisorder = true;
    }

    if (totalDChecked >= 3 && performanceChecked > 0) {
      results.conductDisorder = true;
    }

    if (totalEChecked >= 3 && performanceChecked > 0) {
      results.anxietyDeppression = true;
    }

    // Score Part A. If four or more marks appear in the darkly shaded boxes within Part A then the
    // patient has symptoms highly consistent with ADHD in adults and further investigation is
    // warranted.
    console.log("Test Results: ", results);
    localStorage.setItem("screening-child", JSON.stringify(results));
  }

  function gradeTeenTest(questions) {
    let results = {
      inattentive: false,
      hyperactiveImpulsive: false,
      combined: false,
    };

    let totalAChecked = 0;
    let totalBChecked = 0;

    for (let i = 0; i < 9; i++) {
      let question = document.getElementById("questionTQ" + (i + 1));
      console.log(question);

      let checked = question.querySelector('input[type="radio"]:checked');
      console.log(checked);
      if (checked.value <= 2) {
        totalAChecked++;
      }
    }

    for (let i = 9; i < 18; i++) {
      let question = document.getElementById("questionTQ" + (i + 1));

      let checked = question.querySelector('input[type="radio"]:checked');
      if (checked.value <= 2) {
        totalBChecked++;
      }
    }

    if (totalAChecked >= 6) {
      results.inattentive = true;
    }

    if (totalBChecked >= 6) {
      results.hyperactiveImpulsive = true;
    }

    if (totalAChecked >= 6 && totalBChecked >= 6) {
      results.combined = true;
    }

    console.log("Test Results: ", results);
    localStorage.setItem("screening-teen", JSON.stringify(results));
  }

  function gradeAdultTest(questions) {
    let results = {
      testA: false,
      testB: false,
    };
    let totalChecked = 0;
    let totalBChecked = 0;

    for (let i = 0; i < 6; i++) {
      let question = document.getElementById("questionAQ" + (i + 1));
      console.log(question);
      let severity_value = questions[i].severity_value;

      let checked = question.querySelector('input[type="radio"]:checked');
      console.log(checked);
      if (checked.value > 5 - severity_value) {
        totalChecked++;
      }
    }

    for (let i = 6; i < 18; i++) {
      let question = document.getElementById("questionAQ" + (i + 1));
      let severity_value = questions[i].severity_value;

      let checked = question.querySelector('input[type="radio"]:checked');
      if (checked.value > 5 - severity_value) {
        totalBChecked++;
      }
    }

    if (totalChecked >= 4) {
      results.testA = true;
    }

    if (totalBChecked >= 8) {
      results.testB = true;
    }

    // Score Part A. If four or more marks appear in the darkly shaded boxes within Part A then the
    // patient has symptoms highly consistent with ADHD in adults and further investigation is
    // warranted.
    console.log("Test Results: ", results);
    localStorage.setItem("screening-adult", JSON.stringify(results));
  }

  submitButton.addEventListener("click", function () {
    console.log(selectedDifficulty); // child, teen, adult =>
    console.log(questions);
    localStorage.setItem("selectedDifficulty", selectedDifficulty);

    switch (selectedDifficulty) {
      case "child":
        gradeChildTest(questions);
        break;
      case "teen":
        gradeTeenTest(questions);
        break;
      case "adult":
        gradeAdultTest(questions);
        break;
    }
    swal({
      title: "Testing Completed",
      icon: "success",
      button: "Generate Report",
    }).then((isConfirm) => {
      if (isConfirm) {
        window.location.href = "results";
      }
    });
  });
}

showInitialInstructions();
