var jsPsychTesting = (function (jspsych) {
  "use strict";

  const info = {
    name: "test_trials",
    version: "0.0.1",
    parameters: {
      target_word: {
        type: jspsych.ParameterType.STRING,
        pretty_name: "Target word",
        default: undefined,
        description: "target word to be tested (plays find_{target_word}.wav)"
      },
      second_word: {
        type: jspsych.ParameterType.STRING,
        pretty_name: "Second word",
        default: undefined,
        description: "distractor word against target word"
      },
      randomize: {
        type: jspsych.ParameterType.BOOL,
        pretty_name: "Randomize",
        default: true,
        description: "randomizes which side the target word is on"
      },
      background: {
        type: jspsych.ParameterType.STRING,
        pretty_name: "Background",
        default: "sampling-bg.png",
        description: "background image for the test trials"
      },
      stim_dir: {
        type: jspsych.ParameterType.STRING,
        pretty_name: "stimulus directory",
        default: "stim/",
        description: "file path to the stimulus images and audio"
      }
    }
  };

  // Same sizes as the 2-AFC layout in jspsych-sampling.js, so the squares line up
  // exactly between the sampling and test trials.
  const SQUARE_SIZE = 20; // width/height of each square (cqw)
  const SQUARE_GAP = 6.5; // space between neighbouring squares (cqw)
  const step = SQUARE_SIZE + SQUARE_GAP; // distance between neighbouring squares' centers

  /**
   * Test Trial plugin
   * @author Urvi Suwal
   * Implemented using Claude Code assistance
   */
  class TestTrial {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {
      const STIM_DIR = trial.stim_dir;
      const BACKGROUND = STIM_DIR + trial.background;

      // words[0] = left square, words[1] = right square
      let words = [trial.target_word, trial.second_word];
      if (trial.randomize) words = this.jsPsych.randomization.shuffle(words);

      // Outer box, pinned to the exact center of the screen.
      const wrapper = document.createElement("div");
      wrapper.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        gap: 1vh;
      `;

      // Container:
      //   - container-type lets styles inside use "cqw" (1cqw = 1% of this box's width)
      //   - overflow: hidden cuts off anything that goes past the edges
      const container = document.createElement("div");
      container.id = "test-container";
      container.style.cssText = `
        position: relative;
        background-size: 100% 100%;
        background-repeat: no-repeat;
        container-type: inline-size;
        overflow: hidden;
      `;

      // Square style shared by the grey button and the two picture squares;
      // dx is the offset from the center in units of "step".
      const square_style = (dx) => `
        position: absolute;
        top: 50%;
        left: 50%;
        width: ${SQUARE_SIZE}cqw;
        height: ${SQUARE_SIZE}cqw;
        transform: translate(calc(-50% + ${dx * step}cqw), -50%);
        border-radius: 1cqw;
        box-sizing: border-box;
        padding: 0;
      `;

      // All sounds are made (and start loading) now, not on the click, so they're
      // buffered by the time they're needed.
      const make_audio = (src) => {
        const audio = new Audio(src);
        audio.preload = "auto";
        audio.load();
        return audio;
      };
      const question = make_audio(`${STIM_DIR}find_${trial.target_word}.wav`);
      const bleep = make_audio("stim/bleep.wav");

      let start_time = performance.now();   // trial start (reset once the trial is on screen)
      let boxes_on_time = null;             // when the boxes became pressable
      const boxes = [];
      const images_ready = [];              // one entry per word picture, done once it has loaded

      // Turn the boxes on: pointer cursor, pressable.
      const activate_boxes = () => {
        if (boxes_on_time === null) boxes_on_time = performance.now();
        boxes.forEach((b) => {
          b.disabled = false;
          b.style.cursor = "pointer";
        });
      };

      // Grey button in the center square's spot:
      // - pressing it plays find_{target_word}.wav
      // - the picture squares only become pressable once the whole audio has played
      // - presses while the audio is playing are ignored, so it never overlaps itself
      const play_button = document.createElement("button");
      play_button.id = "test-play";
      play_button.style.cssText = square_style(0) + `
        background-color: #c8c8c8;
        border: 0.2cqw solid black;
        cursor: pointer;
      `;
      container.appendChild(play_button);

      let audio_playing = false;
      play_button.addEventListener("click", () => {
        if (audio_playing) return;
        audio_playing = true;
        let done = false; // "ended", "error" and the catch can't all turn the boxes on
        const on_done = () => {
          if (done) return;
          done = true;
          audio_playing = false;
          activate_boxes();
        };
        question.currentTime = 0;
        question.addEventListener("ended", on_done, { once: true });
        question.addEventListener("error", on_done, { once: true });
        question.play().catch(on_done); // if the audio can't play, turn the boxes on so the trial never gets stuck
      });

      // The two picture squares, left and right of the grey button.
      [-1, 1].forEach((dx, i) => {
        const word = words[i];

        const box = document.createElement("button");
        box.className = "test-square";
        box.id = `test-square-${i}`;
        box.style.cssText = square_style(dx) + `
          background-color: #ffffff;
          border: 0.2cqw solid black;
          cursor: default;
        `;
        box.disabled = true; // off until find_{target_word}.wav has played (see activate_boxes)

        const img = document.createElement("img");
        img.className = "test-img";
        img.dataset.word = word;
        img.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 1.5cqw;
          box-sizing: border-box;
          display: block;
        `;
        // Try .png first, then .jpg. Keep a note of when the picture is ready
        // (or has failed both), so the trial is only shown once it has loaded.
        images_ready.push(
          new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = () => {
              img.onerror = resolve; // .jpg failed too: give up waiting
              img.src = `${STIM_DIR}${word}.jpg`;
            };
            img.src = `${STIM_DIR}${word}.png`;
          })
        );
        box.appendChild(img);

        // Pressing a picture: every button turns off (so only one choice counts),
        // bleep.wav plays, and the trial ends once it has finished.
        box.addEventListener("click", () => {
          const now = performance.now();
          [play_button, ...boxes].forEach((b) => {
            b.disabled = true;
            b.style.cursor = "default";
          });

          // The screen is NOT cleared here: this trial stays visible until the
          // next trial is fully loaded and replaces it, which avoids a blank flash.
          let ended = false;
          const end_trial = () => {
            if (ended) return;
            ended = true;
            wrapper.style.pointerEvents = "none"; // nothing on the old screen can be clicked any more
            [question, bleep].forEach((audio) => audio.pause()); // nothing carries over into the next trial
            this.jsPsych.finishTrial({
              target_word: trial.target_word,
              second_word: trial.second_word,
              words: words,                                 // words[0] = left square, words[1] = right square
              choice: word,                                 // picture that was pressed
              choice_side: i === 0 ? "left" : "right",      // which square it was in
              correct: word === trial.target_word,          // true if they picked the target word
              rt: Math.round(now - boxes_on_time),          // from the boxes turning on to the press (ms)
              time: Math.round(now - start_time),           // from the trial appearing to the press (ms)
            });
          };

          // End once the bleep finishes (or right away if it can't play)
          bleep.addEventListener("ended", end_trial, { once: true });
          bleep.play().catch(end_trial);
        });

        boxes.push(box);
        container.appendChild(box);
      });

      wrapper.appendChild(container);

      // To avoid a blank flash when this trial is shown:
      // - wait until the background and all the images are loaded
      // - only then swap this trial in for whatever was on screen before, so it is never blank in between
      const background = new Image();
      const background_ready = new Promise((resolve) => {
        background.onload = resolve;
        background.onerror = resolve; // don't get stuck if it's missing
      });
      background.src = BACKGROUND;
      Promise.all([background_ready, ...images_ready]).then(() => {
        const ratio = background.naturalWidth / background.naturalHeight;
        container.style.aspectRatio = `${background.naturalWidth} / ${background.naturalHeight}`;
        container.style.width = `min(90vw, calc((90vh - 4em) * ${ratio}))`;
        container.style.backgroundImage = `url("${BACKGROUND}")`;
        display_element.replaceChildren(wrapper);
        start_time = performance.now(); // the trial really starts once it's on screen
      });
    }
  }
  TestTrial.info = info;

  return TestTrial;
})(jsPsychModule);
