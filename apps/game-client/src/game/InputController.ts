type KeyState = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
};

type Vector2 = {
  x: number;
  y: number;
};

type MovementVector = {
  x: number;
  z: number;
};

export class InputController {
  private readonly keys: KeyState = {
    forward: false,
    backward: false,
    left: false,
    right: false
  };

  private dragging = false;
  private cameraDelta: Vector2 = { x: 0, y: 0 };
  private interactPressed = false;
  // Vecteur deplacement tactile (joystick HUD mobile), combine avec le clavier.
  private touch: MovementVector = { x: 0, z: 0 };

  bind(target: Window, canvas: HTMLCanvasElement): void {
    target.addEventListener("keydown", this.handleKeyDown);
    target.addEventListener("keyup", this.handleKeyUp);
    canvas.addEventListener("pointerdown", this.handlePointerDown);
    target.addEventListener("pointerup", this.handlePointerUp);
    target.addEventListener("pointermove", this.handlePointerMove);
  }

  unbind(target: Window, canvas: HTMLCanvasElement): void {
    target.removeEventListener("keydown", this.handleKeyDown);
    target.removeEventListener("keyup", this.handleKeyUp);
    canvas.removeEventListener("pointerdown", this.handlePointerDown);
    target.removeEventListener("pointerup", this.handlePointerUp);
    target.removeEventListener("pointermove", this.handlePointerMove);
  }

  getMovementVector(): MovementVector {
    return {
      x: Number(this.keys.right) - Number(this.keys.left) + this.touch.x,
      z: Number(this.keys.backward) - Number(this.keys.forward) + this.touch.z
    };
  }

  // Joystick tactile : x droite positif, z bas (= recul) positif. Plage [-1, 1].
  setTouchVector(x: number, z: number): void {
    this.touch.x = clamp(x, -1, 1);
    this.touch.z = clamp(z, -1, 1);
  }

  // Bouton action HUD mobile : declenche l'interaction (equivalent touche E).
  pressInteract(): void {
    this.interactPressed = true;
  }

  getCameraDelta(): Vector2 {
    const delta = this.cameraDelta;
    this.cameraDelta = { x: 0, y: 0 };
    return delta;
  }

  consumeInteractPressed(): boolean {
    const pressed = this.interactPressed;
    this.interactPressed = false;
    return pressed;
  }

  resetMovement(): void {
    this.keys.forward = false;
    this.keys.backward = false;
    this.keys.left = false;
    this.keys.right = false;
    this.dragging = false;
    this.cameraDelta = { x: 0, y: 0 };
    this.touch = { x: 0, z: 0 };
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (isEditableTarget(event.target)) {
      return;
    }

    if (event.code === "KeyE") {
      this.interactPressed = true;
      event.preventDefault();
      return;
    }

    this.setKey(event.code, true);
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.setKey(event.code, false);
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.dragging = true;
    event.preventDefault();
  };

  private readonly handlePointerUp = (): void => {
    this.dragging = false;
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.dragging) {
      return;
    }

    this.cameraDelta = {
      x: this.cameraDelta.x + event.movementX,
      y: this.cameraDelta.y + event.movementY
    };
  };

  private setKey(code: string, pressed: boolean): void {
    if (code === "KeyW" || code === "ArrowUp") {
      this.keys.forward = pressed;
    }
    if (code === "KeyS" || code === "ArrowDown") {
      this.keys.backward = pressed;
    }
    if (code === "KeyA" || code === "ArrowLeft") {
      this.keys.left = pressed;
    }
    if (code === "KeyD" || code === "ArrowRight") {
      this.keys.right = pressed;
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable;
}
