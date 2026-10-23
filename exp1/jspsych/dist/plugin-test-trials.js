var test_trials = (function (jspsych) {
  "use strict";

  const info = {
    name: "test_trials",
    version: "0.0.1",
    parameters: {
      
      background: {
        type: jspsych.ParameterType.IMAGE,
        default: undefined,
      },
      words: {
        type: jspsych.ParameterType.COMPLEX,
        array: true,
        pretty_name: "Words",
        default: undefined,
        description: "list of images to be displayed in the test trials"
      },
      target_word: {
        type: jspsych.ParameterType.STRING, 
        default: undefined,
        description: "target word for the trial"
      }
    }

  };

  /**
   * Test Trials plugin
   * @author Urvi Suwal
   * Implemented using Claude Code assistance 
   */
  class TestTrials {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }


    trial(display_element, trial) {

      
      // Outer box, pinned to the exact middle of the screen.
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

      // small grey square in the center of the screen (the button that starts the question)
      const PLAY_SIZE = 8; // width/height of the grey square (cqw)
      const play_button = document.createElement("button");
      play_button.id = "test-play";
      play_button.style.cssText = `
        position: absolute;
        left: 50%;
        top: 50%;
        width: ${PLAY_SIZE}cqw;
        height: ${PLAY_SIZE}cqw;
        transform: translate(-50%, -50%);
        border-radius: 1cqw;
        background-color: #f4f4f4;
        border: none;
        padding: 0;
        cursor: pointer;
      `;
      container.appendChild(play_button);

      // Target word :
      // - pressing the grey square will play the audio that contains the question with the target word
      // - audio file is stim/audio/{target_word}.wav(or .mp3)
      // - image buttons will only be pressable after the grey square is pressed AND the audio has finished
      // - presses while the audio is playing are ignored, so it never overlaps itself
      let audio_playing = false;
      play_button.addEventListener("click", () => {
        if (audio_playing) return;
        audio_playing = true;
        const question = new Audio(`stim/${trial.target_word}.wav`);
        const on_done = () => {
          audio_playing = false;
          activate_boxes();
        };
        question.addEventListener("ended", on_done, { once: true });
        question.play().catch(on_done); // if the audio can't play, turn the boxes on so the trial never gets stuck
      });

      const boxes = [];
      let start_time = performance.now();   // trial start (reset once the trial is on screen)
      const images_ready = [];              // one entry per word picture, done once it has loaded
      let boxes_on_time = null;             // when the boxes became pressable

      // Turn the boxes on: pointer cursor, pressable.
      const activate_boxes = () => {
        if (boxes_on_time === null) boxes_on_time = performance.now();
        boxes.forEach((b) => {
          b.disabled = false;
          b.style.cursor = "pointer";
        });
      };

      const SQUARE_SIZE = 26;    
      const BOX_Y = 50;          
      const box_x = [30, 70];    // horizontal centers 
      // note: add to left and remove the same amount from the right for it to be centered on the screen

     
      box_x.forEach((x, i) => {
        const word = trial.words[i];
        if (word === undefined) return;

        const box = document.createElement("button");
        box.className = "test-square";
        box.id = `test-square-${i}`;
        box.style.cssText = `
          position: absolute;
          left: ${x}%;
          top: ${BOX_Y}%;
          width: ${SQUARE_SIZE}cqw;
          height: ${SQUARE_SIZE}cqw;
          transform: translate(-50%, -50%);
          border-radius: 1cqw;
          background-color: #ffffff;
          border: 0.2cqw solid black;
          box-sizing: border-box;
          padding: 0;
          cursor: default;
        `;
        box.disabled = true; // off until the grey square is clicked (see activate_boxes)

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
              img.src = `stim/imgs/${word}.jpg`;
            };
            img.src = `stim/imgs/${word}.png`;
          })
        );
        box.appendChild(img);

        // Pressing this box: both boxes turn off (so only one choice counts), the
        // picture wiggles (same wiggle as in the sampling trials) and the chime
        // plays. 300ms after the chime ends, the trial ends and saves the choice.

        // on pressing: 
        // - one of the boxes, the other is disabled 
        // - the image inside the box wiggles 
        // in 50ms after the audio ends, the trial ends
        box.addEventListener("click", () => {
          const now = performance.now();
          boxes.forEach((b) => {
            b.disabled = true;
            b.style.cursor = "default";
          });

          // The screen is NOT cleared here: this trial stays visible until the
          // next trial is fully loaded and replaces it, which avoids a blank flash.
          const end_trial = () => {
            wrapper.style.pointerEvents = "none"; // nothing on the old screen can be clicked any more
            this.jsPsych.finishTrial({
              target_word: trial.target_word,
              words: trial.words,                           // words[0] = left box, words[1] = right box
              choice: word,                                 // picture that was pressed
              choice_side: i === 0 ? "left" : "right",      // which box it was in
              correct: word === trial.target_word,          // true if they picked the target word
              rt: Math.round(now - boxes_on_time),          // from clicking the grey square (boxes turning on) to the press (ms)
              time: Math.round(now - start_time),           // time in ms it took to press the box
            });
          };

          // End 50ms after the chime finishes (or immediately if it fails to play)
          const chime = new Audio("stim/alienchime.wav");
          const end_later = () => setTimeout(end_trial, 50);
          chime.addEventListener("ended", end_later, { once: true });
          chime.play().catch(end_later);

          // wiggle animation
          img.animate(
            [
              { transform: "rotate(0deg)" },
              { transform: "rotate(-12deg)" },
              { transform: "rotate(12deg)" },
              { transform: "rotate(-8deg)" },
              { transform: "rotate(8deg)" },
              { transform: "rotate(0deg)" },
            ],
            { duration: 600, easing: "ease-in-out" }
          );
        });

        boxes.push(box);
        container.appendChild(box);
      });

      wrapper.appendChild(container);

      // space_bar is a hidden button so that the container size 
      // matches the ones in the sampling phase and the cover story
      const spacer_bar = document.createElement("div");
      spacer_bar.style.cssText = `
        display: flex;
        visibility: hidden;
      `;
      const spacer_button = document.createElement("button");
      spacer_button.className = "jspsych-btn";
      spacer_button.innerHTML = "&rarr;";
      spacer_button.tabIndex = -1;
      spacer_bar.appendChild(spacer_button);
      wrapper.appendChild(spacer_bar);

      
      // To avoid a blank flash when a new trial/page is shown after this one: 
      // - wait until all the images are loaded 
      // - set background 
      // - onlt swap this trian in for whatever was on screen before so that is never blank in between 
      const background = new Image();
      const background_ready = new Promise((resolve) => {
        background.onload = resolve;
        background.onerror = resolve; // don't get stuck if it's missing
      });
      background.src = trial.background;
      Promise.all([background_ready, ...images_ready]).then(() => {
        const ratio = background.naturalWidth / background.naturalHeight;
        container.style.aspectRatio = `${background.naturalWidth} / ${background.naturalHeight}`;
        container.style.width = `min(90vw, calc((90vh - 4em) * ${ratio}))`;
        container.style.backgroundImage = `url("${trial.background}")`;
        display_element.replaceChildren(wrapper);
        start_time = performance.now(); // the trial really starts once it's on screen
      });
    }
  }
  TestTrials.info = info;

  return TestTrials;
})(jsPsychModule);
