 
/**
 * Author: Urvi Suwal
 * Implemented with Claude Code assistance 
 */
var jsPsych = initJsPsych({

  on_finish: function() {
    jsPsych.data.displayData();
  }
});

var timeline = []; 

var preload = {
  type: jsPsychPreload,
  // every file in the stim folder
  images: [
    "stim/background.png",
    "stim/alien-camera.png", "stim/alien-cheering.png", "stim/alien-smiling.png", "stim/alien-smiling-2.png",
    "stim/alien-thinking.png", "stim/alien-waving.png", "stim/alien-waving.webp",
    "stim/hello.png", "stim/sampling-bg.png", "stim/tablet-blank.png", "stim/tablet-park-guide.png",
    // word pictures (stim/imgs)
    "stim/imgs/apple01.png", "stim/imgs/banana03.png", "stim/imgs/blueberry01.jpg", "stim/imgs/bread.jpg",
  ],
  audio: [
    "stim/alienchime.wav",
  ],
}

// const relevant_domain = jsPsych.randomization.sampleWithoutReplacement(['animal', 'fruit'], 1)[0]
const relevant_domain = 'animal'


var participant_id = {
  type: jsPsychSurveyText,
  questions: [
      {prompt: 'Participant ID', rows: 1, required: true}, 
      {prompt: 'Condition', rows: 1, required: true}, 
  ], 
  on_finish: function(trial){
    jsPsych.data.addProperties({pid: trial.response['Q0'], condition: trial.response['Q1'], relevant_domain: relevant_domain})
  }, 
};

var task_intro = {
  type: cover_story ,
  background: "stim/background.png",
  pages: [
    // pg. 1 background only 
    {
      script: "Today you're going to making a new friend!"
    }, 

    // pg. 2 alien intro 
    {
      script: "This is Miro! Miro is a kid and would like to be your friend!", 
      screen_items: [
        // alien tumbles in: rolls in from the left (one full turn while sliding), overshoots
        // slightly with a tilt, then rocks back and settles at x30 y50
        {name: `
          <style>
            .tumble-in {
              animation: tumble 1.4s ease-out both;
            }
            @keyframes tumble {
              0%   { transform: translateX(-60cqw) rotate(-360deg); }
              65%  { transform: translateX(3cqw)   rotate(20deg); }
              85%  { transform: translateX(-1cqw)  rotate(-6deg); }
              100% { transform: translateX(0)      rotate(0deg); }
            }
          </style>
          <img class="tumble-in" src="stim/alien-smiling.png">
        `, x: 30, y: 50, width: 50},
      ],
    },

    // pg. 3 alien waving
    {
      script: "Miro is saying hi! Press this button to say hi to Miro!", 
      screen_items: [
        {name: "<img src='stim/alien-waving.webp'>", x: 30, y: 50, width: 50},
      ],
    },

    // pg. 4 alien waving with button to interact (hello, lets be friends)
    {
      screen_items: [
        {name: "<img src='stim/alien-waving.webp'>", x: 30, y: 50, width: 50},
      ],
      // purple pulsing button; clicking it hides it and plays the audio
      interactive_item: {
        item_name: "alien-interaction-btn",
        item: `
          <style>
            .pulse-button {width: 100%;
              aspect-ratio: 1;
              box-sizing: border-box;
              border-radius: 50%;
              background-color: #8e24aa;
              border: 1cqw solid #4a148c;
              animation: pulse 2s infinite;
            }
            @keyframes pulse {
              0%   { transform: scale(1);   box-shadow: 0 0 0 0 rgba(142, 36, 170, 0.7); }
              50%  { transform: scale(1.1); box-shadow: 0 0 0 2cqw rgba(142, 36, 170, 0); }
              100% { transform: scale(1);   box-shadow: 0 0 0 0 rgba(142, 36, 170, 0); }
            }
          </style>
          <div class="pulse-button"></div>
        `,
        x: 65,
        y: 70,
        width: 15,
        js: function(el) {
          // swap any .webp images on the page for alien-smiling-2.png
          el.parentElement.querySelectorAll("img[src$='.webp']").forEach(function(img) {
            img.src = "stim/alien-smiling-2.png";
          });
          el.remove();
          // TO-DO: change to stim audio!!
          new Audio("stim/alienchime.wav").play();
        }
      }
    },

    // pg. 5 alien interaction (button to say yes to being friends) 

    {
      script: "Press this button to be friends with Miro!", 
      screen_items: [
        {name: "<img src='stim/alien-smiling-2.png'>", x: 30, y: 50, width: 50},
      ],
      // purple pulsing button; clicking it hides it and plays the audio
      interactive_item: {
        item_name: "alien-interaction-btn",
        item: `
          <style>
            .pulse-button {width: 100%;
              aspect-ratio: 1;
              box-sizing: border-box;
              border-radius: 50%;
              background-color: #8e24aa;
              border: 1cqw solid #4a148c;
              animation: pulse 2s infinite;
            }
            @keyframes pulse {
              0%   { transform: scale(1);   box-shadow: 0 0 0 0 rgba(142, 36, 170, 0.7); }
              50%  { transform: scale(1.1); box-shadow: 0 0 0 2cqw rgba(142, 36, 170, 0); }
              100% { transform: scale(1);   box-shadow: 0 0 0 0 rgba(142, 36, 170, 0); }
            }
          </style>
          <div class="pulse-button"></div>
        `,
        x: 65,
        y: 70,
        width: 15,
        js: function(el) {
          // swap any .png images on the page for alien-cheering.png, and make it jump up and down
          el.parentElement.querySelectorAll("img[src$='.png']").forEach(function(img) {
            img.src = "stim/alien-cheering.png";
            img.style.transformOrigin = "bottom center"; // squash against the ground
            img.animate([
              { transform: "translateY(0)     scale(1.05, 0.95)", easing: "ease-out" }, // crouch, then push off
              { transform: "translateY(-8cqw) scale(0.97, 1.03)", easing: "ease-in", offset: 0.45 }, // top of the jump
              { transform: "translateY(0)     scale(1, 1)", offset: 0.85 }, // land
              { transform: "translateY(0)     scale(1.05, 0.95)" }, // squash on landing
            ], { duration: 700, iterations: Infinity });
          });
          el.remove();
          new Audio("stim/alienchime.wav").play();
        }
      }
    },

    // pg. 6 alien walks in the park
    {
      script: "Miro is walking around in a park. Looks like Miro wants to say something to you.", 
      screen_items: [
        // alien walks from x30 y50 to x68 y50 (38% of the width): the outer div slides it across
        // while the image bobs and rocks side to side with each step
        {name: `
          <style>
            .walk-in {
              animation: walk-across 3s cubic-bezier(0.3, 0.5, 0.6, 1) both;
            }
            .walk-in img {
              transform-origin: bottom center;
              animation: walk-step 0.5s ease-in-out 6;
            }
            @keyframes walk-across {
              from { transform: translateX(-38cqw); }
              to   { transform: translateX(0); }
            }
            @keyframes walk-step {
              0%   { transform: translateY(0)     rotate(0deg); }
              25%  { transform: translateY(-2cqw) rotate(-4deg); }
              50%  { transform: translateY(0)     rotate(0deg); }
              75%  { transform: translateY(-2cqw) rotate(4deg); }
              100% { transform: translateY(0)     rotate(0deg); }
            }
          </style>
          <div class="walk-in">
            <img src="stim/alien-smiling.png">
          </div>
        `, x: 68, y: 50, width: 50},
      ],
    },

    // pg. 7 alien sets Relevant domain
    {
      script: "<i>I really like <span style='color: red;'><b>animals</span>. There are so many different types of <u>animals</u> here! I'm going to explore <u>animals</u> in the park!</i>",
      // clicking the alien plays the chime
      interactive_item: {
        item_name: "alien-smiling",
        item: "<img src='stim/alien-smiling.png'>",
        x: 68,
        y: 50,
        width: 50,
        js: function(el) {
          new Audio("stim/alienchime.wav").play();
        }
      }
    },

    // pg. 7 alien sets Interaction condition (converation need, test, or control) 
    {
      script: "<i>I'll take pictures of all the <u>animals</u> I see with my camera and <span style='color: green;'><b>would love to talk to you about them later</b>!</span></i>",
      // clicking the alien plays the chime
      interactive_item: {
        item_name: "alien-camera",
        item: "<img src='stim/alien-camera.png'>",
        x: 68,
        y: 50,
        width: 50,
        js: function(el) {
          // TO-DO: change auido here
          new Audio("stim/alienchime.wav").play();
        }
      }
    },

    // pg. 8 alien walks out of the frame
    {
      script: `Miro is going to leave and will be back after exploring the <u>animals</u> in the park. <br>
                <i>I'll be back soon! I would love to talk to you about the animals I saw when I come back!</i>`, 
      // alien stands at x68 y50; clicking it makes it walk off to the right, out of the
      // background, with the same bobbing / rocking steps as the walk-in page
      interactive_item: {
        item_name: "alien-walk-out",
        item: `
          <style>
            .walk-out {
              animation: walk-away 3s cubic-bezier(0.4, 0, 0.7, 0.5) both;
            }
            .walk-out img {
              transform-origin: bottom center;
              animation: walk-step 0.5s ease-in-out 6;
            }
            @keyframes walk-away {
              from { transform: translateX(0); }
              to   { transform: translateX(60cqw); }
            }
            @keyframes walk-step {
              0%   { transform: translateY(0)     rotate(0deg); }
              25%  { transform: translateY(-2cqw) rotate(-4deg); }
              50%  { transform: translateY(0)     rotate(0deg); }
              75%  { transform: translateY(-2cqw) rotate(4deg); }
              100% { transform: translateY(0)     rotate(0deg); }
            }
          </style>
          <div class="alien-walker">
            <img src="stim/alien-smiling.png">
          </div>
        `,
        x: 68,
        y: 50,
        width: 50,
        js: function(el) {
          // start the walk by adding the walk-out class (does nothing if it's already walking)
          el.querySelector(".alien-walker").classList.add("walk-out");
          el.style.cursor = "default";
          // TO-DO: change auido here
          new Audio("stim/alienchime.wav").play();
        
        }
      }
    },

    // pg. 9 background
    {
      script: "Alright! Miro will be back soon :)"
    }, 

    // pg. 10 tablet with blank screen
    {
      script: " While Miro is exploring the animals in the park, we can look some picture in this park guide!", 
      screen_items: [
        {
          name: `<img src="stim/tablet-park-guide.png">`,
          x: 50, y: 50, width: 50
        }
      ]
    }, 

    // pg. 11 tablet with park guide
    {
      script: "Press the park guide to look whats inside!", 
      // the tablet gently pulses; clicking it zooms into the tablet while sampling-bg.png fades
      // in over the whole background, then moves on to the next trial (sampling_trials)
      interactive_item: {
        item_name: "tablet-park-guide",
        item: `
          <style>
            .tablet-pulse {
              animation: tablet-pulse 2s ease-in-out infinite;
            }
            @keyframes tablet-pulse {
              0%   { transform: scale(1);    filter: drop-shadow(0 0 0    rgba(46, 43, 85, 0)); }
              50%  { transform: scale(1.04); filter: drop-shadow(0 0 2cqw rgba(46, 43, 85, 0.6)); }
              100% { transform: scale(1);    filter: drop-shadow(0 0 0    rgba(46, 43, 85, 0)); }
            }
          </style>
          <img class="tablet-pulse" src="stim/tablet-park-guide.png">
        `,
        x: 50,
        y: 50,
        width: 50,
        js: function(el, event, controls) {
          // stop it being clicked twice, and stop the pulse
          el.style.pointerEvents = "none";
          const tablet = el.querySelector("img");
          tablet.classList.remove("tablet-pulse");

          // zoom the tablet in until it fills (and goes past) the background
          tablet.animate(
            [{ transform: "scale(1)" }, { transform: "scale(2.6)" }],
            { duration: 900, easing: "ease-in", fill: "forwards" }
          );

          // fade sampling-bg.png in over the whole background during the second half of the zoom
          const cover = document.createElement("div");
          cover.style.cssText = `
            position: absolute;
            inset: 0;
            background: url("stim/sampling-bg.png") center / 100% 100% no-repeat;
            opacity: 0;
          `;
          el.parentElement.appendChild(cover);
          const fade = cover.animate(
            [{ opacity: 0 }, { opacity: 1 }],
            { duration: 450, delay: 450, easing: "ease-out", fill: "forwards" }
          );

          // once the new background is fully shown, end this trial and go to sampling_trials
          fade.onfinish = function() {
            controls.finish();
          };
        }
      }
    }, 
    

  ]
}


var practice_sampling_trial = {
  type: sampling_trials,
  words: ['apple01', 'banana03', 'bread', 'blueberry01'],
  num_trials: 4,
}

var sampling_phase = {
  type: sampling_trials,
  words: ['apple01', 'banana03', 'bread', 'blueberry01', 'apple01', 'banana03', 'bread', 'blueberry01'],
  num_trials: 4,
}

var interaction_phase = {
  type: cover_story,
  background: "stim/background.png",
  pages: [
    // pg. 1 background only
    // {}, 

    // pg. 2 alien walks into the frame from the left
    {
      script: "Miro is back!", 
      // alien starts just past the left edge of the background and walks in to x30 y50,
      // with the same bobbing / rocking steps as the walk-out page
      screen_items: [
        {name: `
          <style>
            .walk-in-left {
              animation: walk-in-from-left 3s cubic-bezier(0.3, 0.5, 0.6, 1) both;
            }
            .walk-in-left img {
              transform-origin: bottom center;
              animation: walk-in-step 0.5s ease-in-out 6;
            }
            /* the alien's right edge is at x55, so -57cqw puts it fully outside the left edge */
            @keyframes walk-in-from-left {
              from { transform: translateX(-57cqw); }
              to   { transform: translateX(0); }
            }
            @keyframes walk-in-step {
              0%   { transform: translateY(0)     rotate(0deg); }
              25%  { transform: translateY(-2cqw) rotate(-4deg); }
              50%  { transform: translateY(0)     rotate(0deg); }
              75%  { transform: translateY(-2cqw) rotate(4deg); }
              100% { transform: translateY(0)     rotate(0deg); }
            }
          </style>
          <div class="walk-in-left">
            <img src="stim/alien-smiling.png">
          </div>
        `, x: 30, y: 50, width: 50},
      ],
    },

    // pg. 3 alien smiling with button to interact 
    {
      script: `Press the button to see what Miro has to say! <br>
        <i>That was so fun! I saw so many kinds of animals! I'm going to show you all the pictures I took!</i>`,  

      screen_items: [
        {name: "<img src='stim/alien-smiling.png'>", x: 30, y: 50, width: 50},
      ],
      // purple pulsing button; clicking it hides it and plays the audio
      interactive_item: {
        item_name: "alien-interaction-btn",
        item: `
          <style>
            .pulse-button {width: 100%;
              aspect-ratio: 1;
              box-sizing: border-box;
              border-radius: 50%;
              background-color: #8e24aa;
              border: 1cqw solid #4a148c;
              animation: pulse 2s infinite;
            }
            @keyframes pulse {
              0%   { transform: scale(1);   box-shadow: 0 0 0 0 rgba(142, 36, 170, 0.7); }
              50%  { transform: scale(1.1); box-shadow: 0 0 0 2cqw rgba(142, 36, 170, 0); }
              100% { transform: scale(1);   box-shadow: 0 0 0 0 rgba(142, 36, 170, 0); }
            }
          </style>
          <div class="pulse-button"></div>
        `,
        x: 65,
        y: 70,
        width: 15,
        js: function(el) {
          // swap any .webp images on the page for alien-smiling-2.png
          el.parentElement.querySelectorAll("img[src$='.webp']").forEach(function(img) {
            img.src = "stim/alien-smiling-2.png";
          });
          el.remove();
          new Audio("stim/alienchime.wav").play();
        }
      }
    },

     // pg. 4 alien showing animal pics
    {
      script: `Here are all the animal pictures I took! Do you know these animals?`,  

      screen_items: [
        {name: "<img src='stim/alien-smiling.png'>", x: 20, y: 70, width: 40},
        
        {name: "<img src='stim/imgs/bread.jpg'>", x: 48, y: 20, width: 18, wiggle: true},
        {name: "<img src='stim/imgs/bread.jpg'>", x:68, y: 20, width: 18, wiggle: true},
        {name: "<img src='stim/imgs/bread.jpg'>", x: 88, y: 20, width: 18, wiggle: true},
        
        {name: "<img src='stim/imgs/bread.jpg'>", x: 48, y: 55, width: 18, wiggle: true},
        {name: "<img src='stim/imgs/bread.jpg'>", x:68, y: 55, width: 18, wiggle: true},
        {name: "<img src='stim/imgs/bread.jpg'>", x: 88, y: 55, width: 18, wiggle: true},

      ],
      
    },
  ]
}



var test_phase = {
  type: test_trials,
  background: "stim/sampling-bg.png",
  words: ['blueberry01', 'bread'],
  target_word: "alienchime",
}



timeline.push(preload);
timeline.push(participant_id);
timeline.push(task_intro);
timeline.push(practice_sampling_trial);
timeline.push(sampling_phase);
timeline.push(test_phase);
timeline.push(interaction_phase);


jsPsych.run(timeline);
