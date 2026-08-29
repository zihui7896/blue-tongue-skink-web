import { createOtterState, reduceOtterState } from "./otter-pet-state.js";

const MOOD_LABELS = {
  idle: "发呆 · 抱着贝壳",
  waving: "互动 · 开心挥爪",
  snacking: "加餐 · 小鱼真香",
  sleeping: "休息 · 抱尾巴午睡",
};

const MOOD_ACTIONS = {
  waving: "greet",
  snacking: "snack",
  sleeping: "rest",
};

export function initOtterPet() {
  const root = document.querySelector("[data-otter-playground]");
  if (!root) return;

  const stage = root.querySelector("[data-otter-stage]");
  const pet = root.querySelector("[data-otter-pet]");
  const message = root.querySelector("[data-otter-message]");
  const status = root.querySelector("[data-otter-status]");
  const buttons = [...root.querySelectorAll("[data-otter-action]")];
  let state = createOtterState();
  let resetTimer = 0;
  let drag = null;
  let suppressClick = false;

  function render() {
    const activeAction = MOOD_ACTIONS[state.mood];
    pet.dataset.mood = state.mood;
    pet.setAttribute("aria-label", `${MOOD_LABELS[state.mood]}。点击和小獭打招呼；方向键可以移动它。`);
    message.textContent = state.message;
    status.textContent = MOOD_LABELS[state.mood];
    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.otterAction === activeAction));
    });
  }

  function interact(action) {
    clearTimeout(resetTimer);
    state = reduceOtterState(state, action);
    render();
    if (state.mood !== "sleeping" && state.mood !== "idle") {
      resetTimer = window.setTimeout(() => {
        state = createOtterState();
        render();
      }, 2800);
    }
  }

  function resetPosition() {
    pet.style.removeProperty("left");
    pet.style.removeProperty("top");
    pet.style.removeProperty("bottom");
    pet.style.removeProperty("transform");
  }

  function moveTo(left, top) {
    const maxLeft = Math.max(0, stage.clientWidth - pet.offsetWidth);
    const maxTop = Math.max(0, stage.clientHeight - pet.offsetHeight - 28);
    pet.style.left = `${Math.max(0, Math.min(maxLeft, left))}px`;
    pet.style.top = `${Math.max(0, Math.min(maxTop, top))}px`;
    pet.style.bottom = "auto";
    pet.style.transform = "none";
  }

  pet.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const petRect = pet.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: petRect.left - stageRect.left,
      top: petRect.top - stageRect.top,
      moved: false,
    };
    pet.setPointerCapture(event.pointerId);
  });

  pet.addEventListener("pointermove", (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < 4) return;
    drag.moved = true;
    pet.classList.add("is-dragging");
    moveTo(drag.left + deltaX, drag.top + deltaY);
  });

  function finishDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    suppressClick = drag.moved;
    drag = null;
    pet.classList.remove("is-dragging");
  }

  pet.addEventListener("pointerup", finishDrag);
  pet.addEventListener("pointercancel", finishDrag);
  pet.addEventListener("click", () => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    interact("greet");
  });

  pet.addEventListener("keydown", (event) => {
    if (event.key === "Home") {
      event.preventDefault();
      resetPosition();
      return;
    }
    const directions = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    const step = event.shiftKey ? 32 : 12;
    const petRect = pet.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    moveTo(
      petRect.left - stageRect.left + direction[0] * step,
      petRect.top - stageRect.top + direction[1] * step,
    );
  });

  buttons.forEach((button) => {
    button.addEventListener("click", () => interact(button.dataset.otterAction));
  });

  render();
}
