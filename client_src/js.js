let lib = {
  refresh_layout: curr => {
    if(curr.getAttribute(`lib_each_child`) != null) {
      // debugger;
      for(let child of curr.children)
        eval(curr.getAttribute(`lib_each_child`));
    }

    if(curr.getAttribute(`lib_demo`)) {
      for(let i = 0; i < curr.children.length; i++)
        if(curr.children[i].tagName == `LIB_DEMO`)
          curr.removeChild(curr.children[i--]);
      for(let width of curr.getAttribute(`lib_demo`).split(` `)) {
        let word = document.createElement(`lib_demo`);
        word.style.width = `${width}ch`; 
        curr.append(word);
      }
    }

    // if(curr.offsetHeight > document.documentElement.offsetHeight) {
    //   curr.style[`padding-right`] = `var(--lib_spacing)`;
    // }
    // if(curr.offsetWidth > document.documentElement.offsetWidth)
    //   curr.style[`padding-bottom`] = `var(--lib_spacing)`;

    if(curr.matches(`textarea, textarea:focus-visible, input, input:focus-visible`))
      curr.setAttribute(`spellcheck`, `false`);

    let style = getComputedStyle(curr);
    if(style[`justify-content`] && style[`justify-content`] != `center` && style[`justify-content`] != `normal`)
      curr.classList.add(`lib_justify_mod`);
    else curr.classList.remove(`lib_justify_mod`);
    if(style[`align-items`] && style[`align-items`] != `center` && style[`align-items`] != `normal`)
      curr.classList.add(`lib_align_mod`);
    else curr.classList.remove(`lib_align_mod`);

    if(curr.style.position == `absolute`) curr.classList.add(`lib_absolute`);
    else curr.classList.remove(`lib_absolute`);

    for(let f of lib.on_refresh_layout) f(curr);

    for(let child of curr.children)
      lib.refresh_layout(child)
  },
  on_refresh_layout: [],
  /*
  - <args> format
    - id: id of popup
    - event: used of positioning
    - use_overlay: if the element <id> has a parent with class <lib_overlay>, it will also be made visible
  */
  popup: args => {
    if(!args.toggle || !args.event) throw `not enough args`;

    args.event.stopPropagation();

    let toggle_element = document.getElementById(args.toggle);
    toggle_element.style.display = null;
    let setup_element;
    
    if(args.setup) {
      setup_element = document.getElementById(args.setup);
      let parent_element = setup_element.parentElement;

      setup_element.style.position = `absolute`;

      let setup_rect = setup_element.getBoundingClientRect();
      let parent_rect = parent_element.getBoundingClientRect();
  
      let left = args.event.pageX; let top = args.event.pageY;
      if(left + setup_rect.width > parent_rect.right - lib.cache_spacing_size)
        left -= left + setup_rect.width - parent_rect.right + lib.cache_spacing_size;
      if(top + setup_rect.height > parent_rect.bottom - lib.cache_spacing_size)
        top -= top + setup_rect.height - parent_rect.bottom + lib.cache_spacing_size;
      setup_element.style.left = `${left}px`;
      setup_element.style.top = `${top}px`;
    }

    let hide_on_outside = event => {if(args.setup ? !setup_element.contains(event.target) : !toggle_element.contains(event.target)) hide();}
    let hide_on_key = event => {if(event.key == `Escape`) hide();}
    let hide = () => {
      toggle_element.style.display = `none`;
      if(args.use_overlay) toggle_element.parentElement.style.display = `none`;
      document.removeEventListener(`click`, hide_on_outside);
      document.removeEventListener(`keydown`, hide_on_key);
    }

    document.addEventListener(`click`, hide_on_outside);
    document.addEventListener(`keydown`, hide_on_key);
  },
  expensive_css_size_to_px: size => {
    let el = document.createElement(`lib_row`);
    el.style.visibility = `hidden`;
    el.style.width = size;
    document.body.appendChild(el);

    let result = parseFloat(getComputedStyle(el).width);

    document.body.removeChild(el);

    return result;
  }
};
document.addEventListener(`DOMContentLoaded`, () => {
  lib.window = document.querySelector(`.lib_window`);
  if(!lib.window) return;
  lib.refresh_layout(lib.window);

  lib.tooltip = document.createElement(`lib_row`);
  lib.tooltip.id = `lib_tooltip`;
  lib.tooltip.classList.add(`lib_absolute`);
  lib.tooltip.style.display = `none`;
  lib.tooltip.style[`pointer-events`] = `none`;
  lib.tooltip.style[`background`] = `var(--lib_transparent)`;
  lib.window.append(lib.tooltip);

  lib.cache_spacing_size = lib.expensive_css_size_to_px(`var(--lib_spacing)`);

  let last_tooltip_element;
  let window_rect = lib.window.getBoundingClientRect();
  let tooltip_rect;
  document.addEventListener(`mousemove`, event => {
    let target = event.target.closest(`*[lib_tooltip]`);

    if(!target) {
      lib.tooltip.style.display = `none`;
      return;
    };

    lib.tooltip.style.display = `block`;

    if(last_tooltip_element != target) {
      lib.tooltip.innerHTML = target.getAttribute(`lib_tooltip`);
      tooltip_rect = lib.tooltip.getBoundingClientRect();
      last_tooltip_element = target;
    }

    let left = event.pageX; let top = event.pageY;
    if(left + tooltip_rect.width > window_rect.right)
      left -= left + tooltip_rect.width - window_rect.right + lib.cache_spacing_size;
    if(top + tooltip_rect.height > window_rect.bottom)
      top -= top + tooltip_rect.height - window_rect.bottom + lib.cache_spacing_size;
    lib.tooltip.style.left = `${left}px`;
    lib.tooltip.style.top = `${top}px`;
  });

  for(let curr of document.querySelectorAll(`lib_include`))
    fetch(curr.innerHTML).then(body => {
      console.log(body);
      curr.innerHTML = body
    });
});