// Tuning and world constants for Gobble Dash. One place holds every number the
// other modules share, so a balance change never needs a hunt through the game.
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const GROUND_Y = 600;
export const GRAVITY = 2000;
export const STEP = 1 / 60;

export const LIVES = 3;
export const STAGE_LENGTH = 9000; // pixels of running per stage
export const WORLD_LENGTH = STAGE_LENGTH * 2; // farmyard, then kitchen, then the forest gate
export const METER_PX = 50; // pixels per metre shown on the HUD

export const TURKEY_RUN_SPEED = 285;
export const TURKEY_PUSH_SPEED = 62; // extra speed while holding Right
export const TURKEY_BACK_SPEED = 150; // how much holding Left slows the run
export const TURKEY_JUMP_SPEED = 1000;
export const TURKEY_DASH_MULT = 1.7;
export const TURKEY_WIDTH = 64;
export const TURKEY_HEIGHT = 58;

export const FARMER_CATCH_GAP = 46; // farmer this close to the turkey catches it
export const FARMER_CHASE_BONUS = 34; // farmer runs a little faster than the turkey
export const FARMER_LUNGE_BONUS = 60; // extra speed when the turkey is almost cornered
export const FARMER_SEARCH_TIME = 3.0; // seconds the farmer hunts a haystack

export const STAMINA_MAX = 100;
export const STAMINA_DRAIN = 42; // per second of dashing
export const STAMINA_REGEN = 20; // per second while not dashing

export const CORN_SCORE = 100;
export const FEATHER_SCORE = 500;
export const BEST_KEY = 'gobble-dash-best';
