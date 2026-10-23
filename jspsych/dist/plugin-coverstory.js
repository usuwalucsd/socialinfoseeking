var cover_story = (function (jspsych) {
  "use strict";

  const info = {
    name: "cover_story",
    version: "0.0.1",
    parameters: {
   
      background: {
        type: jspsych.ParameterType.IMAGE,
        default: undefined,
      },
      /**
       * the pages paramter is an array of slides that would be displayed to the 
       * participant. The design is similar to the default instruction plugin, 
       * but with more functionality/customizability. 
       * Each page can have 
       * - screen_items: an array of images or text that are displayed on the page 
       * - interactive_item: an interactive item (like a button), with a js function that is run when the item is clicked
      */
      pages: {
        type: jspsych.ParameterType.COMPLEX,
        array: true,
        default: undefined,
        nested: {

          // DEMO ONLY: shows script where there is the next and prev button 
          script: {
            type: jspsych.ParameterType.HTML_STRING, 
            default: undefined, 
          }, 

          /**
           * screen_items: list of things to show on the screen for the particular page
           * this plugin considers the background as a 100 x 100 grid
           * - x (left) and y (top) (0-100) say where the CENTER of the item goes
           * - width (0-100) as a % of the background's width
           * - wiggle: if true, the item is a button that wiggles when pressed
           *           (each press is saved in the page's screen_item_clicks)
           */
          screen_items: {
            type: jspsych.ParameterType.COMPLEX,
            array: true,
            default: [],
            nested: {
              name: {
                type: jspsych.ParameterType.HTML_STRING,
                default: undefined,
              },
              x: {
                type: jspsych.ParameterType.INT,
                default: 0,
              },
              y: {
                type: jspsych.ParameterType.INT,
                default: 0,
              },
              width: {
                type: jspsych.ParameterType.INT,
                default: 10,
              },
              wiggle: {
                type: jspsych.ParameterType.BOOL,
                default: false,
              },
            },
          },
          /**
           * interactive_item: a single item that can be interacted with on the page
           * this plugin considers the background as a 100 x 100 grid
           * - x (left) and y (top) (0-100) say where the CENTER of the item goes
           * - width (0-100) as a % of the background's width
           * - js: a function that is run when the item is clicked, with arguments:
           * - item_name: a label for it, saved in the data
           * - item: what it looks like (HTML)
           * - js: what happens when it's clicked: js(el, event, controls).
           *       el is the clicked element, so it can hide it, move it, change it, etc.
           *       controls lets it move on by itself:
           *       controls.next()     - go to the next page (or end the trial on the last page)
           *       controls.previous() - go back a page
           *       controls.finish()   - end the trial straight away
           */
          interactive_item: {
            type: jspsych.ParameterType.COMPLEX,
            default: null,
            nested: {
              item_name: {
                type: jspsych.ParameterType.STRING,
                default: undefined,
              },
              item: {
                type: jspsych.ParameterType.HTML_STRING,
                default: undefined,
              },
              x: {
                type: jspsych.ParameterType.INT,
                default: 50,
              },
              y: {
                type: jspsych.ParameterType.INT,
                default: 50,
              },
              width: {
                type: jspsych.ParameterType.INT,
                default: 10,
              },
              js: {
                type: jspsych.ParameterType.FUNCTION,
                default: () => {},
              },
            },
          },
        },
      },
      /** Text on the "go back" button (default: a left arrow). */
      button_label_previous: {
        type: jspsych.ParameterType.STRING,
        default: "&larr;",
      },
      /** Text on the "go forward" button (default: a right arrow). */
      button_label_next: {
        type: jspsych.ParameterType.STRING,
        default: "&rarr;",
      },
      /** Text on the forward button on the LAST page, which ends the trial. */
      button_label_finish: {
        type: jspsych.ParameterType.STRING,
        default: "&rarr;",
      },
    },
  };

  /**
   * Cover Story plugin
   * @author Urvi Suwal
   * Implemented using Claude Code assistance
   */
  class CoverStory{
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {

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
      container.id = "coverstory-container";
      container.style.cssText = `
        position: relative;
        background-size: 100% 100%;
        background-repeat: no-repeat;
        container-type: inline-size;
        overflow: hidden;
      `;

      // Nav buttons 
      const button_bar = document.createElement("div");
      button_bar.id = "coverstory-buttons";
      button_bar.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1em;
      `;


      // append elements to the wrapper and to the display_element
      wrapper.appendChild(container);
      wrapper.appendChild(button_bar);
      display_element.innerHTML = "";
      display_element.appendChild(wrapper);

      
      // experiment data 

      const start_time = performance.now(); // trial start
      const view_history = [];              // page visited tracker 
      let current_page = 0;                 // current page that is showing 
      let page_start_time = start_time;     // when the current page appeared

  
      // full page data, saved together at the end of the trial
      const page_data = trial.pages.map((page, page_index) => ({
        page_index: page_index,
        script: page.script ?? null,
        screen_items: (page.screen_items || []).map((item) => ({ ...item })),
        interactive_item: page.interactive_item
          ? {
              item_name: null,
              x: 50,
              y: 50,
              width: 10,
              ...page.interactive_item,
              js: page.interactive_item.js ? page.interactive_item.js.toString() : null,
            }
          : null,
        interaction_happened: false,
        interaction_type: null,
        screen_item_clicks: [], // presses on wiggle items: which item and when (ms since trial start)
      }));

      // Display a page: 
      // Builds everything for one page, waits until its pictures are ready,
      // then swaps it in for the old page all at once.

      const show_page = (page_index) => {
        const page = trial.pages[page_index];
        const elements = []; // everything we'll put on the background for this page

        // display screen items for this page 
        (page.screen_items || []).forEach((item, item_index) => {
          const el = document.createElement("div");
          el.className = "coverstory-item";
          el.style.cssText = `
            position: absolute;
            left: ${item.x}%;
            top: ${item.y}%;
            width: ${item.width}%;
            transform: translate(-50%, -50%);
          `;
          // Wiggle items get an inner box to rotate, so the wiggle doesn't undo
          // the centering transform on el.
          const content = item.wiggle ? document.createElement("div") : el;
          content.innerHTML = item.name;
          if (item.wiggle) {
            el.appendChild(content);
            el.style.cursor = "pointer";
            el.addEventListener("click", () => {
              page_data[page_index].screen_item_clicks.push({
                item_index: item_index,
                time: Math.round(performance.now() - start_time),
              });
              // same wiggle as the sampling trials
              content.animate(
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
          }
          // Stretch any picture inside to fill the box's width (height follows automatically).
          el.querySelectorAll("img").forEach((img) => {
            img.style.width = "100%";
            img.style.height = "auto";
            img.style.display = "block";
          });
          elements.push(el);
        });

       // interaction item set up for this page 
        if (page.interactive_item) {
          // Fill in any settings that were left out with their defaults.
          // (jsPsych doesn't do this for us here, so we do it ourselves.)
          const interactive = { item_name: null, x: 50, y: 50, width: 10, js: () => {}, ...page.interactive_item };
          // Same placement as the non-clickable items, plus a pointing-hand cursor.
          const el = document.createElement("div");
          el.className = "coverstory-interactive-item";
          el.style.cssText = `
            position: absolute;
            left: ${interactive.x}%;
            top: ${interactive.y}%;
            width: ${interactive.width}%;
            transform: translate(-50%, -50%);
            cursor: pointer;
          `;
          el.innerHTML = interactive.item;
          // Stretch any picture inside to fill the box's width.
          el.querySelectorAll("img").forEach((img) => {
            img.style.width = "100%";
            img.style.height = "auto";
            img.style.display = "block";
          });

          // Ways for the page's js to move on by itself (e.g. after an animation).
          const is_last_page = page_index === trial.pages.length - 1;
          const controls = {
            next: () => (is_last_page ? end_trial() : go_to(page_index + 1)),
            previous: () => page_index > 0 && go_to(page_index - 1),
            finish: () => end_trial(),
          };
      
          // Note when the interaction items are interacted with 
          // When it's clicked: note it in the data, then run the page's js.
          el.addEventListener("click", (event) => {
            page_data[page_index].interaction_happened = true;
            page_data[page_index].interaction_type = "click";
            interactive.js(el, event, controls);
          });
          elements.push(el);
        }

        // Navigation buttons
        const is_last = page_index === trial.pages.length - 1;
        const previous = make_button(trial.button_label_previous, () => go_to(page_index - 1));
        if (page_index === 0) previous.style.visibility = "hidden";
        const next = make_button(is_last ? trial.button_label_finish : trial.button_label_next, () =>
          is_last ? end_trial() : go_to(page_index + 1)
        );

        // Script (demo only): the page's script, shown between the two buttons
        const script = document.createElement("div");
        script.className = "coverstory-script";
        script.style.cssText = `
          flex: 1;
          text-align: center;
          font-size: 1.8em;
          color: #888;
        `;
        script.innerHTML = page.script ?? "";

        // Swap the new page in: 
        // Wait until every picture on this page has loaded, THEN replace the old
        // page's items and buttons in one go. This stops things flickering or
        // jumping, and makes sure animations don't start on a blank picture.
        const images = elements.flatMap((el) => Array.from(el.querySelectorAll("img")));
        Promise.all(images.map((img) => img.decode().catch(() => {}))).then(() => {
          // If the participant already clicked to another page while we were
          // waiting, don't show this one.
          if (page_index !== current_page) return;
          container.replaceChildren(...elements);
          button_bar.replaceChildren(previous, script, next);
        });
      };

      // Makes one light-grey arrow button that runs `on_click` when pressed.
      const make_button = (label, on_click) => {
        const button = document.createElement("button");
        button.className = "jspsych-btn";
        button.innerHTML = label;
        button.style.backgroundColor = "#e0e0e0";
        button.style.borderColor = "#c4c4c4";
        button.addEventListener("click", on_click);
        return button;
      };

      // Notes down which page was just shown and how long it was on screen (in ms).
      const record_view = () => {
        const now = performance.now();
        view_history.push({
          page_index: current_page,
          viewing_time: Math.round(now - page_start_time),
        });
        page_start_time = now;
      };

      // Moves to another page: note the time spent on the current one, then show the new one.
      const go_to = (page_index) => {
        record_view();
        current_page = page_index;
        show_page(current_page);
      };

     
      // End trial function
      // - record the last page's viewing time
      // - clear the display
      // - save the data and finish the trial
      const end_trial = () => {
        record_view();
        display_element.innerHTML = "";
        this.jsPsych.finishTrial({
          background: trial.background, // the background picture used
          pages: page_data,             // what was on each page, and whether it was clicked
          view_history: view_history,   // every page visited, in order, with time spent
          rt: Math.round(performance.now() - start_time), // total time in the trial (ms)
        });
      };

      
      // Start: 
      // - load the background picture
      // - size the background box to match it (as big as fits on screen, leaving room for the buttons)
      // - show the first page  
      const background = new Image();
      background.onload = () => {
        const ratio = background.naturalWidth / background.naturalHeight;
        container.style.aspectRatio = `${background.naturalWidth} / ${background.naturalHeight}`;
        // width goes on the wrapper so a long script wraps instead of widening the button bar
        wrapper.style.width = `min(90vw, calc((90vh - 4em) * ${ratio}))`;
        container.style.backgroundImage = `url("${trial.background}")`;
        show_page(current_page);
      };
      background.src = trial.background;
    }
  }
  CoverStory.info = info;

  return CoverStory;
})(jsPsychModule);
