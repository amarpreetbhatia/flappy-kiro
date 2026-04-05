# Requirements Document

## Introduction

Flappy Kiro is a retro-styled, browser-based endless scroller game inspired by Flappy Bird. The player controls a ghost character (Ghosty) navigating through an infinite series of pipe obstacles. The game runs entirely in the browser with no server-side dependencies, using HTML5 Canvas for rendering. It features retro pixel aesthetics, sound effects, score tracking, and a game over/restart flow.

## Glossary

- **Game**: The Flappy Kiro browser application as a whole
- **Ghosty**: The ghost sprite character controlled by the player, rendered using `assets/ghosty.png`
- **Pipe**: A vertical obstacle pair (top and bottom) with a gap that Ghosty must pass through
- **Gap**: The vertical opening between the top and bottom sections of a Pipe pair
- **Canvas**: The HTML5 Canvas element on which the Game is rendered
- **Score**: The integer count of Pipe pairs successfully passed by Ghosty in the current session
- **High_Score**: The highest Score achieved across sessions, persisted in browser local storage
- **Game_Loop**: The continuous update-and-render cycle that drives gameplay
- **Gravity**: The constant downward acceleration value applied to Ghosty's vertical velocity on every frame
- **Jump**: The upward velocity impulse applied to Ghosty on player input
- **Ascent_Velocity**: The fixed upward velocity value assigned to Ghosty's vertical velocity when a Jump is triggered
- **Terminal_Velocity**: The maximum downward vertical speed Ghosty may reach, beyond which Gravity no longer increases Ghosty's downward velocity
- **Delta_Time**: The elapsed time in seconds between consecutive frames, used to scale physics calculations for frame-rate-independent movement
- **Collision**: The event where Ghosty's Hitbox overlaps a Pipe boundary or the Canvas boundary
- **Hitbox**: The rectangular collision area used for Ghosty, inset from the visible sprite bounds to provide a smaller, fairer collision region
- **Pipe_Bounds**: The precise rectangular region of a single pipe segment (top or bottom) used for collision detection
- **Collision_Animation**: A brief visual reaction applied to Ghosty upon Collision, such as flashing or shaking, before the Game_Over_Screen is shown
- **Invincibility_Frames**: A fixed-duration period at the start of each game session during which Ghosty cannot trigger a Collision
- **Start_Screen**: The initial UI state shown before gameplay begins
- **Game_Over_Screen**: The UI state shown after a Collision occurs
- **Paused_State**: The game state entered when the player pauses during active gameplay, during which all movement and physics are frozen
- **Pause_Overlay**: The semi-transparent UI layer rendered over the Canvas while the game is in the Paused_State, displaying a pause message and resume instruction
- **Retro_Style**: A visual aesthetic using pixel fonts, limited color palette, and scanline or CRT-like effects
- **Cloud**: A semi-transparent decorative background element that scrolls horizontally to create a parallax depth effect
- **Parallax_Layer**: A set of Clouds sharing the same scroll speed, where layers closer to the foreground scroll faster than layers further in the background
- **Pipe_Spacing**: The fixed horizontal distance in pixels between the leading edge of one Pipe pair and the leading edge of the next
- **Gap_Size**: The fixed vertical height in pixels of the Gap that Ghosty must pass through
- **Pipe_Speed**: The current horizontal scroll speed of all Pipes in pixels per second
- **Speed_Increment**: The amount by which Pipe_Speed increases at each defined score milestone
- **Background_Music**: A looping ambient or retro-style audio track that plays continuously during active gameplay
- **Score_Sound**: A short distinct sound effect played each time the Score increments by 1
- **Screen_Shake**: A brief positional offset animation applied to the Canvas rendering context upon a Collision, simulating a camera shake
- **Particle_Trail**: A short-lived sequence of small decorative particles emitted from Ghosty's position while Ghosty is in motion, fading out over time
- **Score_Pop**: A brief scale-up-then-return animation applied to the Score display text each time the Score increments

---

## Requirements

### Requirement 1: Game Initialization and Start Screen

**User Story:** As a player, I want to see a start screen when I open the game, so that I know how to begin playing.

#### Acceptance Criteria

1. WHEN the Game is loaded in a browser, THE Game SHALL display the Start_Screen before any gameplay begins
2. THE Start_Screen SHALL display the game title "Flappy Kiro" in a Retro_Style pixel font
3. THE Start_Screen SHALL display an instruction prompt indicating the player must press Space or tap the screen to start
4. WHEN a High_Score value is present in browser local storage, THE Start_Screen SHALL display that High_Score value
5. WHEN no High_Score value is present in browser local storage, THE Start_Screen SHALL display a High_Score of 0
6. WHEN the player presses the Space key or taps the Canvas on the Start_Screen, THE Game SHALL transition to active gameplay and begin the Game_Loop

---

### Requirement 2: Ghosty Physics and Player Control

**User Story:** As a player, I want to control Ghosty by pressing Space or tapping the screen, so that I can navigate through pipes.

#### Acceptance Criteria

1. WHILE the Game_Loop is active, THE Game SHALL apply a fixed Gravity constant to Ghosty's vertical velocity on every frame, scaled by Delta_Time, so that downward acceleration is consistent regardless of frame rate
2. WHEN the player presses the Space key or taps the Canvas during active gameplay, THE Game SHALL set Ghosty's vertical velocity to the fixed Ascent_Velocity value, providing an immediate upward impulse without resetting any horizontal state
3. WHILE the Game_Loop is active, THE Game SHALL cap Ghosty's downward vertical velocity at Terminal_Velocity so that Ghosty cannot accelerate beyond a defined maximum fall speed
4. WHILE the Game_Loop is active, THE Game SHALL carry Ghosty's vertical velocity across frames without abrupt resets, preserving momentum so that velocity changes are continuous between updates
5. WHILE the Game_Loop is active, THE Game SHALL update Ghosty's vertical position each frame by adding the product of Ghosty's current velocity and Delta_Time, producing sub-pixel-accurate, frame-rate-independent movement
6. THE Game SHALL render Ghosty using the `assets/ghosty.png` sprite at Ghosty's current position
7. WHEN the player triggers a Jump, THE Game SHALL play the `assets/jump.wav` sound effect

---

### Requirement 3: Pipe Generation and Scrolling

**User Story:** As a player, I want an endless stream of pipe obstacles, so that the game provides a continuous challenge.

#### Acceptance Criteria

1. WHILE the Game_Loop is active, THE Game SHALL scroll all Pipes horizontally from right to left at the current Pipe_Speed, scaled by Delta_Time, so that movement is frame-rate-independent
2. THE Game SHALL generate a new Pipe pair at a fixed Pipe_Spacing horizontal distance measured from the leading edge of the most recently spawned Pipe pair
3. THE Game SHALL set the Gap height for every Pipe pair to the fixed Gap_Size value
4. WHEN a new Pipe pair is spawned, THE Game SHALL randomize the vertical center of the Gap within safe bounds so that the entire Gap remains fully visible within the Canvas height
5. WHEN a Pipe pair scrolls fully off the left edge of the Canvas, THE Game SHALL remove that Pipe pair from the active game state
6. THE Game SHALL initialize Pipe_Speed to a fixed starting value at the beginning of each game session
7. WHEN the Score reaches a multiple of a defined score milestone, THE Game SHALL increase Pipe_Speed by Speed_Increment so that the game becomes progressively harder over time
8. THE Game SHALL apply the updated Pipe_Speed to all currently active Pipes and all subsequently spawned Pipes immediately upon the speed increase

---

### Requirement 4: Collision Detection and Game Over

**User Story:** As a player, I want the game to end when Ghosty hits a pipe or boundary, so that there are clear failure conditions.

#### Acceptance Criteria

1. THE Game SHALL define Ghosty's Hitbox as a rectangle inset from the visible sprite bounds by a fixed number of pixels on all sides, so that the collision area is smaller than the rendered sprite
2. THE Game SHALL define each Pipe_Bounds as the precise rectangular region of the top or bottom pipe segment, aligned to the pipe's rendered position and dimensions
3. WHEN Ghosty's Hitbox overlaps any Pipe_Bounds, THE Game SHALL trigger a Collision
4. WHEN Ghosty's Hitbox reaches or crosses the bottom edge of the Canvas, THE Game SHALL trigger a Collision
5. WHEN Ghosty's Hitbox reaches or crosses the top edge of the Canvas, THE Game SHALL trigger a Collision
6. WHILE Invincibility_Frames are active, THE Game SHALL suppress all Collision detection so that Ghosty cannot trigger a Collision during that period
7. WHEN a new game session begins, THE Game SHALL activate Invincibility_Frames for a fixed duration of 2 seconds before enabling Collision detection
8. WHEN a Collision is triggered, THE Game SHALL play the `assets/game_over.wav` sound effect
9. WHEN a Collision is triggered, THE Game SHALL begin the Collision_Animation by alternating Ghosty's rendered opacity between fully visible and fully transparent at a fixed interval for a fixed duration of 600 milliseconds
10. WHILE the Collision_Animation is playing, THE Game SHALL cease Ghosty movement and Pipe scrolling
11. WHEN the Collision_Animation completes, THE Game SHALL transition to the Game_Over_Screen

---

### Requirement 4.5: Pause Functionality

**User Story:** As a player, I want to pause the game during active gameplay, so that I can take a break without losing my current run.

#### Acceptance Criteria

1. WHEN the player presses the Escape key or the P key during active gameplay, THE Game SHALL enter the Paused_State
2. WHILE the game is in the Paused_State, THE Game SHALL freeze all Pipe scrolling, Ghosty movement, and physics updates so that the game world does not advance
3. WHILE the game is in the Paused_State, THE Game SHALL render the Pause_Overlay on top of the Canvas, displaying a "Paused" message and an instruction indicating the player must press Escape or P to resume
4. WHEN the player presses the Escape key or the P key while the game is in the Paused_State, THE Game SHALL exit the Paused_State and resume all movement and physics from the exact state at which the game was paused
5. WHILE the game is in the Paused_State, THE Game SHALL ignore Space key and Canvas tap inputs so that the player cannot trigger a Jump or restart while paused
6. IF a Collision is triggered before the game enters the Paused_State, THEN THE Game SHALL not allow the player to enter the Paused_State during the Collision_Animation or on the Game_Over_Screen

---

### Requirement 5: Score Tracking and High Score Persistence

**User Story:** As a player, I want to see my score and personal best, so that I have a goal to beat.

#### Acceptance Criteria

1. WHEN Ghosty passes through the Gap of a Pipe pair without Collision, THE Game SHALL increment the Score by 1
2. WHILE the Game_Loop is active, THE Game SHALL display the current Score on the Canvas in a Retro_Style font, updating the displayed value immediately on every Score increment
3. WHEN a Collision is triggered, THE Game SHALL read the High_Score value from browser local storage
4. WHEN no High_Score value is present in browser local storage, THE Game SHALL treat the stored High_Score as 0 for comparison purposes
5. WHEN the final Score exceeds the stored High_Score, THE Game SHALL write the new High_Score value to browser local storage, overwriting any previously stored value
6. THE Game_Over_Screen SHALL display the final Score and the High_Score

---

### Requirement 6: Game Over Screen and Restart

**User Story:** As a player, I want to restart the game after losing, so that I can try to beat my high score.

#### Acceptance Criteria

1. THE Game_Over_Screen SHALL display a "Game Over" message in a Retro_Style pixel font
2. THE Game_Over_Screen SHALL display the final Score and the High_Score
3. THE Game_Over_Screen SHALL display a prompt indicating the player must press Space or tap the screen to restart
4. WHEN the player presses the Space key or taps the Canvas on the Game_Over_Screen, THE Game SHALL reset all game state and transition to the Start_Screen
5. WHEN the Game resets, THE Game SHALL restore Ghosty to its initial position and remove all active Pipes from the Canvas

---

### Requirement 7: Retro Visual Style

**User Story:** As a player, I want the game to have a retro aesthetic, so that it feels like a classic arcade experience.

#### Acceptance Criteria

1. THE Game SHALL render all UI text using a pixel-style font consistent with Retro_Style
2. THE Game SHALL use a limited color palette for the background, Pipes, and UI elements consistent with Retro_Style
3. THE Canvas SHALL display a scrolling background or static background color that reinforces the Retro_Style
4. THE Game SHALL render Pipes with a flat, pixel-art style consistent with the Retro_Style color palette
5. WHERE the browser supports it, THE Game SHALL apply a subtle visual effect (such as a scanline overlay) to reinforce the Retro_Style
6. THE Game SHALL render Clouds as semi-transparent decorative elements in the background, consistent with the Retro_Style color palette

---

### Requirement 9: Cloud Parallax Scrolling

**User Story:** As a player, I want to see clouds moving at different speeds in the background, so that the game has a sense of depth and visual richness.

#### Acceptance Criteria

1. WHILE the Game_Loop is active, THE Game SHALL render at least two Parallax_Layers of Clouds at distinct scroll speeds
2. THE Game SHALL scroll Parallax_Layers further from the foreground at a slower speed than Parallax_Layers closer to the foreground
3. THE Game SHALL render each Cloud with a semi-transparent fill so that the background color remains partially visible through the Cloud
4. WHEN a Cloud scrolls fully off the left edge of the Canvas, THE Game SHALL reposition that Cloud to the right edge of the Canvas to maintain continuous coverage
5. THE Game SHALL distribute Clouds across Parallax_Layers at varied vertical positions to avoid uniform alignment
6. THE Game SHALL render all Clouds behind Pipes and Ghosty in the draw order

---

### Requirement 10: Audio Feedback

**User Story:** As a player, I want sound effects and background music during gameplay, so that the game feels immersive and responsive to my actions.

#### Acceptance Criteria

1. WHEN the player triggers a Jump during active gameplay, THE Game SHALL play the `assets/jump.wav` sound effect (this asset already exists)
2. WHEN a Collision is triggered, THE Game SHALL play the `assets/game_over.wav` sound effect (this asset already exists)
3. WHEN Ghosty passes through the Gap of a Pipe pair and the Score increments, THE Game SHALL play the Score_Sound effect
4. THE Score_Sound SHALL be a short, distinct audio cue audibly different from the jump and game-over sounds; as no asset exists yet, THE Game SHALL generate or source this sound and include it as a static asset
5. WHILE the Game_Loop is active and the game is not in the Paused_State, THE Game SHALL play the Background_Music in a continuous loop
6. WHEN the game enters the Paused_State, THE Game SHALL pause the Background_Music playback
7. WHEN the game exits the Paused_State and resumes active gameplay, THE Game SHALL resume Background_Music playback from the position at which it was paused
8. WHILE the Start_Screen or Game_Over_Screen is displayed, THE Game SHALL stop Background_Music playback
9. THE Background_Music SHALL be a looping ambient or retro-style audio track; as no asset exists yet, THE Game SHALL generate or source this track and include it as a static asset
10. IF the browser blocks autoplay of audio before a user interaction, THEN THE Game SHALL begin Background_Music playback on the first player input that starts a game session

---

### Requirement 11: Visual Effects

**User Story:** As a player, I want visual feedback for collisions, movement, and scoring, so that the game feels polished and reactive.

#### Acceptance Criteria

1. WHEN a Collision is triggered, THE Game SHALL begin a Screen_Shake effect by applying a series of small random positional offsets to the Canvas rendering context for a fixed duration of 400 milliseconds
2. WHILE the Screen_Shake is active, THE Game SHALL render each frame with a distinct random offset so that the shake appears continuous rather than static
3. WHEN the Screen_Shake duration elapses, THE Game SHALL restore the Canvas rendering context to its unshifted position
4. WHILE the Game_Loop is active, THE Game SHALL emit Particle_Trail particles from Ghosty's current position on every frame
5. THE Game SHALL render each Particle_Trail particle as a small shape (such as a circle or star) in a ghost-like or sparkle color consistent with the Retro_Style palette
6. THE Game SHALL animate each Particle_Trail particle by reducing its opacity from fully visible to fully transparent over a fixed lifetime of no more than 500 milliseconds, after which THE Game SHALL remove the particle from the active particle list
7. THE Game SHALL offset each newly emitted Particle_Trail particle by a small random displacement from Ghosty's center so that the trail has a natural spread
8. WHEN the Score increments, THE Game SHALL begin a Score_Pop animation on the Score display by scaling the Score text up to a larger size over a fixed duration, then scaling it back to its normal size
9. THE Score_Pop animation SHALL complete within 300 milliseconds so that the display returns to its normal size before the next potential Score increment
10. WHILE a Score_Pop animation is in progress and another Score increment occurs, THE Game SHALL restart the Score_Pop animation from its initial scale-up state

---

### Requirement 8: Browser Compatibility and Standalone Delivery

**User Story:** As a player, I want to play the game directly in my browser without installing anything, so that it is immediately accessible.

#### Acceptance Criteria

1. THE Game SHALL run entirely in the browser using HTML, CSS, and JavaScript with no server-side runtime required
2. THE Game SHALL function correctly in current versions of Chrome, Firefox, and Safari
3. THE Game SHALL be deliverable as a single `index.html` file or a minimal set of static files openable from the local filesystem
4. THE Game SHALL load and initialize within 3 seconds on a standard desktop connection when served from a local filesystem
5. IF the browser does not support the HTML5 Canvas API, THEN THE Game SHALL display a message informing the player that their browser is not supported
