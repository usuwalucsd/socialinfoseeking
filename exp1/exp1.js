 
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



// var preload = {
//   type: jsPsychPreload,
//   // every file in the stim folder
//   images: [],
//   audio: [],
// }

// randomly assign conditions 
const relevant_domain = jsPsych.randomization.sampleWithoutReplacement(['land_animal', 'sea_animal'], 1)[0]
// const need = jsPsych.randomization.sampleWithoutReplacement([true, false], 1)[0]; 

const land_animals = [
  'aadrvark',
  'badger',
  'cow',
  'giraffe',
  'lemur',
  'panda',
  'tiger',
  'wombat'
]
const sea_animals = [
  'beluga',
  'crab',
  'dolphin',
  'jellyfish',
  'lobster',
  'narwhal',
  'starfish',
  'turtle']
// const relevant_domain = 'land_animal' 
const need = true



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

    // task intro: "today you're going to meet someone" 
    {
      script: "Today you're going to meet someone!"
    }, 

    // alien intro: alien tumbles in
    {
      script: "This is Miro!", 
      screen_items: [
        {name: `
          <style>
            .tumble-in {animation: tumble 1.4s ease-out both;}
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

    // alien waving: miro is saying hi
    {
      script: "Miro is saying hi!", 
      screen_items: [
        {name: "<img src='stim/alien-waving.webp'>", x: 30, y: 50, width: 50},
      ],
    },


    // interact with alien: press this button to say hi to miro
    // miro: "hi! I'm Miro, nice to meet you!"
    {
      script:  "Press this button to say hi to Miro!", 
      screen_items: [
        {name: "<img src='stim/alien-waving.webp'>", x: 30, y: 50, width: 50},
      ],
      interactive_item: {
        item_name: "alien-interaction-btn",
        // purple pulsing button for interacting with alien 
        item: `
          <style> 
            .pulse-button { width: 100%; aspect-ratio: 1; box-sizing: border-box; border-radius: 50%;
              background-color: #8e24aa; border: 1cqw solid #4a148c; animation: pulse 2s infinite; }
            @keyframes pulse {
              0%   { transform: scale(1);   box-shadow: 0 0 0 0 rgba(142, 36, 170, 0.7); }
              50%  { transform: scale(1.1); box-shadow: 0 0 0 2cqw rgba(142, 36, 170, 0); }
              100% { transform: scale(1);   box-shadow: 0 0 0 0 rgba(142, 36, 170, 0); }
            }
          </style>
          <div class="pulse-button"></div>
        `,
        x: 65, y: 70, width: 15,
        js: function(el) {
          // swap any .webp images on the page for alien-smiling-2.png
          el.parentElement.querySelectorAll("img[src$='.webp']").forEach(function(img) {
            img.src = "stim/alien-smiling-2.png";
          });
          el.remove();
          // TO-DO: change placeholder audio
          new Audio("stim/alienchime.wav").play(); 
        }
      }
    },

    // // interaction with alien (be friends)
    // {
    //   script: "Press this button to be friends with Miro!<>", 
    //   screen_items: [
    //     {name: "<img src='stim/alien-smiling-2.png'>", x: 30, y: 50, width: 50},
    //   ],
    //   // purple pulsing button; clicking it hides it and plays the audio
    //   interactive_item: {
    //     item_name: "alien-interaction-btn",
    //     item: `
    //       <style>
    //         .pulse-button {width: 100%;
    //           aspect-ratio: 1;
    //           box-sizing: border-box;
    //           border-radius: 50%;
    //           background-color: #8e24aa;
    //           border: 1cqw solid #4a148c;
    //           animation: pulse 2s infinite;
    //         }
    //         @keyframes pulse {
    //           0%   { transform: scale(1);   box-shadow: 0 0 0 0 rgba(142, 36, 170, 0.7); }
    //           50%  { transform: scale(1.1); box-shadow: 0 0 0 2cqw rgba(142, 36, 170, 0); }
    //           100% { transform: scale(1);   box-shadow: 0 0 0 0 rgba(142, 36, 170, 0); }
    //         }
    //       </style>
    //       <div class="pulse-button"></div>
    //     `,
    //     x: 65,
    //     y: 70,
    //     width: 15,
    //     js: function(el) {
    //       // swap any .png images on the page for alien-cheering.png, and make it jump up and down
    //       el.parentElement.querySelectorAll("img[src$='.png']").forEach(function(img) {
    //         img.src = "stim/alien-cheering.png";
    //         img.style.transformOrigin = "bottom center"; // squash against the ground
    //         img.animate([
    //           { transform: "translateY(0)     scale(1.05, 0.95)", easing: "ease-out" }, // crouch, then push off
    //           { transform: "translateY(-8cqw) scale(0.97, 1.03)", easing: "ease-in", offset: 0.45 }, // top of the jump
    //           { transform: "translateY(0)     scale(1, 1)", offset: 0.85 }, // land
    //           { transform: "translateY(0)     scale(1.05, 0.95)" }, // squash on landing
    //         ], { duration: 700, iterations: Infinity });
    //       });
    //       el.remove();
    //       new Audio("stim/alienchime.wav").play();
    //     }
    //   }
    // },

    // alien walking: Miro is walking around in a park. Looks like Miro wants to say something to you.
    {
      script: "Miro is walking around in a park. Looks like Miro wants to say something to you.", 
      screen_items: [
        {name: `
          <style>
            .walk-in {animation: walk-across 3s cubic-bezier(0.3, 0.5, 0.6, 1) both;}
            .walk-in img {transform-origin: bottom center; animation: walk-step 0.5s ease-in-out 6;}
            @keyframes walk-across { from { transform: translateX(-38cqw); } to   { transform: translateX(0); } }
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
          </div>`,
        x: 68, y: 50, width: 50},
      ],
    },

    // --------------- RELEVANT DOMAIN ---------------
    {
      script: `<i>I really like <span style='color: red;'><b>`+ relevant_domain + `</span>. There are so many different types of <u>`+ relevant_domain + `</u> here! I'm going to explore <u>animals</u> in the park!</i>`,
      // clicking the alien plays the chime
      interactive_item: {
        item_name: "alien-smiling",
        item: "<img src='stim/alien-smiling.png'>",
        x: 68,
        y: 50,
        width: 50,
        js: function(el) {
          // TO-DO: change placeholder audio
          // let domain_audio = 'stim/domain_' + relevant_domain + '.wav'
          // new Audio(domain_audio); 
          new Audio("stim/alienchime.wav").play();
        }
      }
    },

    //  --------------- CONVERSATION NEED ---------------
    {
      script: `<i>I'll take pictures of all the <u>`+ relevant_domain + `</u> I see with my camera and <span style='color: green;'><b>would love to talk to you about them later</b>!</span></i>`,
      // clicking the alien plays the chime
      interactive_item: {
        item_name: "alien-camera",
        item: "<img src='stim/alien-camera.png'>",
        x: 68,
        y: 50,
        width: 50,
        js: function(el) {
          // TO-DO: change placeholder audio
          new Audio("stim/alienchime.wav").play();
        }
      }
    },

    // alien leaves and walks away from screen
    {
      script: `Miro is going to leave and will be back after exploring the <u>`+ relevant_domain + `</u> in the park. <br>
                <i>I'll be back soon! I would love to talk to you about the `+ relevant_domain + ` I saw when I come back!</i>`, 
    
      interactive_item: {
        item_name: "alien-walk-out",
        item: `
          <style>
            .walk-out {animation: walk-away 3s cubic-bezier(0.4, 0, 0.7, 0.5) both;}
            .walk-out img {transform-origin: bottom center; animation: walk-step 0.5s ease-in-out 6;}
            @keyframes walk-away {
              from { transform: translateX(0); } to   { transform: translateX(60cqw); } }
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
          // TO-DO: change placeholder audio here
          new Audio("stim/alienchime.wav").play();
        
        }
      }
    },

    // alright miro will be back soon
    {
      script: "Alright! Miro will be back soon." 
    },
  ] 
}; 

var attn_ceck = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `<img src="stim/alien-smiling.png" width='300vw'>`,
    choices: [
      `<img src="stim/horse.jpg"  width='300vw'>`,
      `<img src="stim/octopus.png"  width='300vw'>`,
    ],
};

var task_instruction2 = {
       type: cover_story ,
        background: "stim/background.png",
        pages: [

    // introduce park guide
    {
      script: `While Miro is exploring the ` + relevant_domain + ` in the park, we can look at this park guide to see all the things that are in the park! Remember, Miro really likes land/sea animals (and will be back with pictures to show you!)`, 
      screen_items: [
        {
          name: `<img src="stim/tablet-park-guide.png">`,
          x: 50, y: 50, width: 50
        }
      ]
    }, 

    // interact with the park guide 
    {
      script: "Press the park guide to look whats inside!", 
      // the tablet gently pulses; clicking it zooms into the tablet while sampling-bg.png fades
      // in over the whole background, then moves on to the next trial (sampling_trials)
      interactive_item: {
        item_name: "tablet-park-guide",
        item: `
          <style>
            .tablet-pulse { animation: tablet-pulse 2s ease-in-out infinite; }
            @keyframes tablet-pulse {
              0%   { transform: scale(1);    filter: drop-shadow(0 0 0    rgba(46, 43, 85, 0)); }
              50%  { transform: scale(1.04); filter: drop-shadow(0 0 2cqw rgba(46, 43, 85, 0.6)); }
              100% { transform: scale(1);    filter: drop-shadow(0 0 0    rgba(46, 43, 85, 0)); }
            }
          </style>
          <img class="tablet-pulse" src="stim/tablet-park-guide.png">
        `,
        x: 50, y: 50, width: 50,
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


const practice_words = ['sturgeon', 'fish', 'dog', 'wombat']

var practice_sampling_trial = {
  type: jsPsychSampling,
  words: jsPsych.randomization.shuffle(practice_words),
  background: 'stim/sampling-bg.png', 
  stim_dir: 'stim/animals/', 
  randomize: true,
}

var first_interaction_phase = {
  type: cover_story,
  background: "stim/background.png",
  pages: [

    // alien walks into the frame from the left
    {
      script: "Look, Miro is back!", 
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
        <i>I just saw a `+ relevant_domain+`.</i>`,  

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

    {
      script: "Here is a picture of an animal I just saw, I have no idea what it is. Do you know what animal this is?", 
      screen_items: [
        {name: "<img src='stim/alien-smiling.png'>", x: 30, y: 50, width: 50},

        {name: "<div style='background: white; border: 2px solid black'> <img src='stim/animals/wombat.png'> </div>", x: 70, y: 40, width: 35, wiggle: true},
      ],

    }, 

    // alien leaves and walks away from screen
    {
      script: `Miro is going to leave and will be back after exploring the <u>`+ relevant_domain + `</u> in the park. <br>
                <i>I'll be back soon! I would love to talk to you about the `+ relevant_domain + ` I saw when I come back!</i>`, 
    
      interactive_item: {
        item_name: "alien-walk-out",
        item: `
          <style>
            .walk-out {animation: walk-away 3s cubic-bezier(0.4, 0, 0.7, 0.5) both;}
            .walk-out img {transform-origin: bottom center; animation: walk-step 0.5s ease-in-out 6;}
            @keyframes walk-away {
              from { transform: translateX(0); } to   { transform: translateX(60cqw); } }
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
          // TO-DO: change placeholder audio here
          new Audio("stim/alienchime.wav").play();
        
        }
      }
    },

    // interact with the park guide 
    {
      script: "Let's go back and look at the park guide again! remember miro likes " + relevant_domain + '.', 
      // the tablet gently pulses; clicking it zooms into the tablet while sampling-bg.png fades
      // in over the whole background, then moves on to the next trial (sampling_trials)
      interactive_item: {
        item_name: "tablet-park-guide",
        item: `
          <style>
            .tablet-pulse { animation: tablet-pulse 2s ease-in-out infinite; }
            @keyframes tablet-pulse {
              0%   { transform: scale(1);    filter: drop-shadow(0 0 0    rgba(46, 43, 85, 0)); }
              50%  { transform: scale(1.04); filter: drop-shadow(0 0 2cqw rgba(46, 43, 85, 0.6)); }
              100% { transform: scale(1);    filter: drop-shadow(0 0 0    rgba(46, 43, 85, 0)); }
            }
          </style>
          <img class="tablet-pulse" src="stim/tablet-park-guide.png">
        `,
        x: 50, y: 50, width: 50,
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






var test_phase = {
  type: jsPsychTesting,
  target_word: "cow",
  non_target_word: "wombat",
}


// timeline.push(preload);
// timeline.push(participant_id);
timeline.push(task_intro);
timeline.push(attn_ceck); 
timeline.push(task_instruction2);
timeline.push(practice_sampling_trial);
timeline.push(first_interaction_phase);
timeline.push(practice_sampling_trial);
timeline.push(test_phase);
// timeline.push(interaction_phase);


jsPsych.run(timeline);
