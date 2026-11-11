var jsPsychSampling = (function (jspsych) {
    "use strict";

    const info = {
        name: "sampling",
        version: "0.0.1",
        parameters: {
            words: {
                type: jspsych.ParameterType.COMPLEX,
                array: true,
                pretty_name: "Words",
                default: undefined,
                description: "list of images to be displayed in the sampling trials (must be 2 or 4)"
            },
            randomize: {
                type: jspsych.ParameterType.BOOL,
                pretty_name: "Randomize",
                default: false,
                description: "randomizes the array of words for the trial"
            }, 
            background: {
                type: jspsych.ParameterType.STRING, 
                pretty_name: "Background", 
                default: "sampling-bg.png", 
                description: "background image for the sampling trials"
            }, 
            stim_dir: {
                type: jspsych.ParameterType.STRING, 
                pretty_name: "stimulus directory", 
                default: "stim/", 
                description: "file path to the stimulus images"
            } 

            
        }
    };
   

    // Each layout: square size and gap (cqw), and the squares' [x offset, y offset]
    // from the center in units of "step". The first square is always the center one.
    //
    // 2 words: one square on each side of the center
    // 4 words: two stacked on each side of the center (left and right)
    const LAYOUTS = {
        2: {
            size: 20,
            gap: 6.5,
            positions: [
                [0, 0],      // center
                [-1, 0],     // left
                [1, 0],      // right
            ],
            names: ["center", "left", "right"],
        },
        4: {
            size: 20,
            gap: 6.5,
            positions: [
                [0, 0],      // center
                [-1, -0.5],  // left, top
                [-1, 0.5],   // left, bottom
                [1, -0.5],   // right, top
                [1, 0.5],    // right, bottom
            ],
            names: ["center", "left_top", "left_bottom", "right_top", "right_bottom"],
        },
    };

    /**
     * Sampling Trial plugin
     * One press per trial: the pressed picture wiggles, glides to the center
     * square, and then the trial ends.
     * @author Urvi Suwal
     * Implemented using Claude Code assistance
     */
    class SamplingTrials {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }
        trial(display_element, trial) {
            const IMG_DIR = trial.stim_dir; 
            const BACKGROUND = trial.background; 


            // // randomize words if parameter is true (shuffle returns a new array)
            const words = trial.randomize
                ? this.jsPsych.randomization.shuffle(trial.words)
                : trial.words.slice();

            // layout for the sampling trials
            const afc = words.length;
            const layout = LAYOUTS[afc];
            if (!layout) {
                display_element.innerHTML = `<p style="color: red;">Sampling trial error: words must have 2 or 4 items (got ${afc}).</p>`;
                throw new Error(`jsPsychSampling: "words" must have 2 or 4 items, got ${afc}.`);
            }

            // Layout:
            // wrapper    = an outer box in the center of the screen
            // container  = the background picture, where all the items go
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

        
            const SQUARE_SIZE = layout.size; // width/height of each square (cqw)
            const SQUARE_GAP = layout.gap;   // space between neighbouring squares (cqw)
            const step = SQUARE_SIZE + SQUARE_GAP; // distance between neighbouring squares' centers

            const start_time = performance.now(); // trial start, for response times

            // All sounds are made (and start loading) now, not on the click, so they're
            // buffered by the time they're needed: the chime for the wiggle, and each
            // word's own {word}.wav for when its picture arrives in the center.
            const make_audio = (src) => {
                const audio = new Audio(src);
                audio.preload = "auto";
                audio.load();
                return audio;
            };
            const chime = make_audio("stim/trill.wav");
            const word_audio = {};
            words.forEach((w) => { word_audio[w] = make_audio(`${IMG_DIR}${w}.wav`); });

            // The surrounding squares are buttons; the center one is a plain box.
            const buttons = [];
            let busy = false; // true once a button is pressed; other presses are ignored
            let choice = null; // the one press in this trial, saved when the trial ends

            layout.positions.forEach(([dx, dy], i) => {
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

                if (i > 0) {
                    const word = words[i - 1];
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
                // wiggles (with the chime) and glides over to sit in the center square.
                // 500ms after it lands there, {word}.wav plays and 350ms after it ends
                // the trial ends.
                square.addEventListener("click", () => {
                    if (busy) return;
                    busy = true;
                    choice = {
                        word: word,                                      // picture that was pressed
                        position: layout.names[i],                       // which square it was in
                        rt: Math.round(performance.now() - start_time),  // since the trial started (ms)
                    };

                    buttons.forEach((b) => {
                        b.disabled = true;
                        b.style.cursor = "default";
                        b.style.backgroundColor = "#c8c8c8";
                        // hide every picture except the one that was pressed
                        const other = b.querySelector("img");
                        if (other && other !== img) other.style.visibility = "hidden";
                    });
                    square.style.zIndex = 1; // keep the moving picture above the other squares

                    chime.play().catch(() => {}); // a failed chime shouldn't stop the trial

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

                    // The center square is the same size, so moving the picture back by
                    // this square's offset puts it exactly over the center square.
                    wiggle.onfinish = () => {
                        const glide = img.animate(
                            [
                                { transform: "translate(0, 0)" },
                                { transform: `translate(${-dx * step}cqw, ${-dy * step}cqw)` },
                            ],
                            { duration: 800, easing: "ease-in-out", fill: "forwards" }
                        );

                        // {word}.wav plays 500ms after the picture lands in the center.
                        // End 350ms after {word}.wav ends (or right away + 350ms if the
                        // file is missing or can't play, so the trial never gets stuck).
                        glide.onfinish = () => setTimeout(() => {
                            let end_queued = false; // "ended" and the catch can't both end the trial
                            const end_later = () => {
                                if (end_queued) return;
                                end_queued = true;
                                setTimeout(end_trial, 350);
                            };
                            const audio = word_audio[word];
                            audio.addEventListener("ended", end_later, { once: true });
                            audio.addEventListener("error", end_later, { once: true });
                            audio.play().catch(end_later);
                        }, 500);
                    };
                });
                buttons.push(square);
            }

            container.appendChild(square);
        });

        // Put the pieces together and put them on the screen.
        wrapper.appendChild(container);
        display_element.innerHTML = "";
        display_element.appendChild(wrapper);

        // =======================================================================
        // END THE TRIAL
        // After the pressed picture reaches the center: clear the screen and save the data.
        // =======================================================================
        let ended = false;
        const end_trial = () => {
            if (ended) return;
            ended = true;
            // stop every sound so nothing carries over into the next trial
            [chime, ...Object.values(word_audio)].forEach((audio) => audio.pause());
            display_element.innerHTML = "";
            this.jsPsych.finishTrial({
                afc: afc,                     // 2 or 4
                choice: choice.word,          // picture that was pressed
                choice_position: choice.position, // which square it was in (see LAYOUTS)
                rt: choice.rt,                // time until the press (ms)
                words: words,                 // order shown: words[k] is in square names[k + 1]
            });
        };

        // Load the picture to find its shape, then size the box to match it: as big
        // as fits in 90% of the screen. (Same as the coverstory plugin, so the two
        // backgrounds line up exactly.)
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
