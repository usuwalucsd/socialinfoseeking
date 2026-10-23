var sampling_trials = (function (jspsych) {
  "use strict";

  const info = {
    name: "sampling_trials",
    version: "0.0.1",
    parameters: {
        words: {
            type: jspsych.ParameterType.COMPLEX,
            array: true,
            pretty_name: "Words",
            default: undefined,
            description: "list of images to be displayed in the sampling trials"
        },

        num_trials: {
            type: jspsych.ParameterType.INT,
            pretty_name: "Number of trials",
            default: 1,
            description: "Number of sampling trials to run"
        }
    }
     
  };

  // The background picture used for every sampling trial.
  const BACKGROUND = "stim/sampling-bg.png";

  /**
   * Sampling Trials plugin
   * @author Urvi Suwal
   * Implemented using Claude Code assistance
   */
  class SamplingTrials {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    
    trial(display_element, trial) {

     
      const words = trial.words;

      // Layout: 
      // wrapper    = an outer box in the middle of the screen, holding the two parts below
      // container  = the background picture, where all the items go
      // button_bar = the row of arrow buttons under the background
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

    
      const container = document.createElement("div");
      container.id = "sampling-container";
      container.style.cssText = `
        position: relative;
        background-image: url("${BACKGROUND}");
        background-size: 100% 100%;
        background-repeat: no-repeat;
        container-type: inline-size;
        overflow: hidden;
      `;

      // Nav buttons
      const button_bar = document.createElement("div");
      button_bar.id = "sampling-buttons";
      button_bar.style.cssText = `
        display: flex;
        justify-content: flex-end;
      `;

      // Light-grey Next button (same look as the coverstory buttons). Clicking it ends the trial.
      const next = document.createElement("button");
      next.className = "jspsych-btn";
      next.innerHTML = "&rarr;";
      next.style.backgroundColor = "#e0e0e0";
      next.style.borderColor = "#c4c4c4";
      button_bar.appendChild(next);

      // =======================================================================
      // THE SQUARES
      // One square in the exact middle of the background, with the word squares
      // around it. All the same size, slightly rounded.
      // Sizes use "cqw" so the squares grow and shrink with the background.
      //
      // 4 words: two stacked on each side of the middle (left and right)
      // 8 words: a 3 x 3 grid, the middle square surrounded by all eight
      // =======================================================================

      // Each layout: square size and gap (cqw), and the squares' [x offset, y offset]
      // from the middle in units of "step". The first square is always the middle one.
      const layouts = {
        4: {
          size: 20,
          gap: 6.5,
          positions: [
            [0, 0],      // middle
            [-1, -0.5],  // left, top
            [-1, 0.5],   // left, bottom
            [1, -0.5],   // right, top
            [1, 0.5],    // right, bottom
          ],
          names: ["middle", "left_top", "left_bottom", "right_top", "right_bottom"],
        },
        // smaller squares so all three rows fit in the height of the background
        8: {
          size: 14,
          gap: 4,
          positions: [
            [0, 0],      // middle
            [-1, -1],    // top left
            [0, -1],     // top
            [1, -1],     // top right
            [-1, 0],     // left
            [1, 0],      // right
            [-1, 1],     // bottom left
            [0, 1],      // bottom
            [1, 1],      // bottom right
          ],
          names: ["middle", "top_left", "top", "top_right", "left", "right", "bottom_left", "bottom", "bottom_right"],
        },
      };
      // 8 words get the grid; anything else uses the 4-word layout
      const layout = words.length === 8 ? layouts[8] : layouts[4];

      const SQUARE_SIZE = layout.size; // width/height of each square (cqw)
      const SQUARE_GAP = layout.gap;   // space between neighbouring squares (cqw)
      const step = SQUARE_SIZE + SQUARE_GAP; // distance between neighbouring squares' centers

      const start_time = performance.now(); // trial start, for response times

      // Where the word pictures live. Pictures are a mix of .png and .jpg, so we
      // try .png first and fall back to .jpg if it isn't there.
      const IMG_DIR = "stim/imgs/";

      const square_positions = layout.positions;
      const position_names = layout.names;

      // The surrounding squares are buttons; the middle one is a plain box.
      const buttons = [];
      let busy = false; // true while a press is playing out; other presses are ignored
      let ready_time = start_time; // when the buttons last became pressable

      // One entry per button press, saved with the trial when Next is clicked.
      const samples = [];

      square_positions.forEach(([dx, dy], i) => {
        const square = document.createElement(i > 0 ? "button" : "div");
        square.className = "sampling-square";
        square.id = `sampling-square-${i}`;
        square.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          width: ${SQUARE_SIZE}cqw;
          height: ${SQUARE_SIZE}cqw;
          transform: translate(calc(-50% + ${dx * step}cqw), calc(-50% + ${dy * step}cqw));
          border-radius: 1cqw;
          background-color: #ffffff;
          border: 0.2cqw solid black;
          box-sizing: border-box;
          padding: 0;
          ${i > 0 ? "cursor: pointer;" : ""}
          transition: background-color 0.3s;
        `;
        // The middle square stays empty. The surrounding squares each get one of
        // the words' pictures, scaled to fit inside the square.
        const word = words[i - 1];
        if (i > 0 && word !== undefined) {
          const img = document.createElement("img");
          img.className = "sampling-img";
          img.dataset.word = word;
          img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
            padding: 1.5cqw;
            box-sizing: border-box;
            display: block;
          `;
          img.onerror = () => {
            img.onerror = null;
            img.src = `${IMG_DIR}${word}.jpg`;
          };
          img.src = `${IMG_DIR}${word}.png`;
          square.appendChild(img);

          // Pressing a button: grey out every button, then the pressed picture
          // wiggles (with the chime) and glides over to sit in the middle square.
          // Once there, the chime plays again and 350ms after it ends everything
          // resets, so the participant can press again.
          square.addEventListener("click", () => {
            if (busy) return;
            busy = true;
            const now = performance.now();
            samples.push({
              sample: samples.length + 1,             // 1 = first press in this trial
              word: word,                             // picture that was pressed
              position: position_names[i],            // which square it was in
              rt: Math.round(now - ready_time),       // since the buttons were last pressable (ms)
              time: Math.round(now - start_time),     // since the trial started (ms)
            });

            buttons.forEach((b) => {
              b.disabled = true;
              b.style.cursor = "default";
              b.style.backgroundColor = "#c8c8c8";
              // hide every picture except the one that was pressed
              const other = b.querySelector("img");
              if (other && other !== img) other.style.visibility = "hidden";
            });
            square.style.zIndex = 1; // keep the moving picture above the other squares

            new Audio("stim/alienchime.wav").play();

            const wiggle = img.animate(
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

            // The middle square is the same size, so moving the picture back by
            // this square's offset puts it exactly over the middle square.
            wiggle.onfinish = () => {
              const glide = img.animate(
                [
                  { transform: "translate(0, 0)" },
                  { transform: `translate(${-dx * step}cqw, ${-dy * step}cqw)` },
                ],
                { duration: 800, easing: "ease-in-out", fill: "forwards" }
              );

              glide.onfinish = () => {
                // Back to how it started: pictures in their own squares, buttons white and pressable.
                const reset = () => {
                  // That was the last sample: end the trial instead of resetting.
                  if (samples.length >= trial.num_trials) {
                    end_trial();
                    return;
                  }
                  glide.cancel();
                  square.style.zIndex = "";
                  buttons.forEach((b) => {
                    b.disabled = false;
                    b.style.cursor = "pointer";
                    b.style.backgroundColor = "#ffffff";
                    b.querySelector("img").style.visibility = "";
                  });
                  ready_time = performance.now();
                  busy = false;
                };

                // Reset 350ms after the second chime ends (or right away + 350ms
                // if the sound can't play, so the trial never gets stuck).
                const chime = new Audio("stim/alienchime.wav");
                const reset_later = () => setTimeout(reset, 350);
                chime.addEventListener("ended", reset_later, { once: true });
                chime.play().catch(reset_later);
              };
            };
          });
          buttons.push(square);
        }

        container.appendChild(square);
      });

      // Put the pieces together and put them on the screen.
      wrapper.appendChild(container);
      wrapper.appendChild(button_bar);
      display_element.innerHTML = "";
      display_element.appendChild(wrapper);

      // =======================================================================
      // END THE TRIAL
      // After num_trials button presses (or when Next is clicked): clear the
      // screen and save the data.
      // =======================================================================
      let ended = false;
      const end_trial = () => {
        if (ended) return; // e.g. Next clicked while the last press was playing out
        ended = true;
        display_element.innerHTML = "";
        this.jsPsych.finishTrial({
          rt: Math.round(performance.now() - start_time), // time until the trial ended (ms)
          samples: samples, // every button press, in order (see the click handler above)
          n_samples: samples.length, // how many presses
          words: words, // order given: words[k] is in square position_names[k + 1] (see the layouts above)
          layout: words.length === 8 ? "grid_8" : "sides_4", // which layout was shown
        });
      };
      next.addEventListener("click", end_trial);

      // Load the picture to find its shape, then size the box to match it: as big
      // as fits in 90% of the screen, leaving room for the button underneath.
      // (Same as the coverstory plugin, so the two backgrounds line up exactly.)
      const background = new Image();
      background.onload = () => {
        const ratio = background.naturalWidth / background.naturalHeight;
        container.style.aspectRatio = `${background.naturalWidth} / ${background.naturalHeight}`;
        container.style.width = `min(90vw, calc((90vh - 4em) * ${ratio}))`;
      };
      background.src = BACKGROUND;
    }
  }
  SamplingTrials.info = info;

  return SamplingTrials;
})(jsPsychModule);
