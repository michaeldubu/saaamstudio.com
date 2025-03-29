# SAAAM API Reference

This document provides a comprehensive reference for the SAAAM language API, listing all built-in functions, constants, and classes available in the SAAAM game development environment.

## Table of Contents
* [Core Functions](#core-functions)
* [Drawing Functions](#drawing-functions)
* [Input Functions](#input-functions)
* [Audio Functions](#audio-functions)
* [Math Functions](#math-functions)
* [Physics Functions](#physics-functions)
* [Data Functions](#data-functions)
* [Time Functions](#time-functions)
* [UI Functions](#ui-functions)
* [Vector Functions](#vector-functions)
* [Constants](#constants)
* [Classes](#classes)

## Core Functions

### Engine Registration

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `SAAAM.registerCreate(func)` | Register the create function | `func`: Function to call at creation | None |
| `SAAAM.registerStep(func)` | Register the step function | `func`: Function to call each step | None |
| `SAAAM.registerDraw(func)` | Register the draw function | `func`: Function to call each draw | None |
| `SAAAM.registerDestroy(func)` | Register the destroy function | `func`: Function to call at destruction | None |

### Game Object Management

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `create_object(type, x, y)` | Create a new game object | `type`: Object type, `x`, `y`: Position | Object reference |
| `destroy_object(object)` | Destroy a game object | `object`: Object to destroy | None |
| `find_object(type)` | Find an object by type | `type`: Object type to find | Object or null |
| `find_objects(type)` | Find all objects of a type | `type`: Object type to find | Array of objects |
| `find_nearest(type, x, y)` | Find nearest object of type | `type`: Object type, `x`, `y`: Position | Object or null |
| `object_count(type)` | Count objects of a type | `type`: Object type to count | Number |
| `exists(object)` | Check if object exists | `object`: Object to check | Boolean |

## Drawing Functions

### Basic Drawing

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `draw_sprite(sprite, x, y)` | Draw a sprite | `sprite`: Sprite name, `x`, `y`: Position | None |
| `draw_sprite_ext(sprite, subimg, x, y, xscale, yscale, rot, color, alpha)` | Draw sprite with transforms | Multiple transform parameters | None |
| `draw_text(text, x, y, color)` | Draw text | `text`: String to draw, `x`, `y`: Position, `color`: Text color | None |
| `draw_text_ext(text, x, y, color, font, size, align)` | Draw text with formatting | Adds font, size and alignment options | None |
| `draw_rectangle(x1, y1, x2, y2, color)` | Draw a rectangle | `x1`, `y1`, `x2`, `y2`: Coordinates, `color`: Fill color | None |
| `draw_rectangle_outline(x1, y1, x2, y2, color, thickness)` | Draw rectangle outline | Adds `thickness` parameter | None |
| `draw_circle(x, y, radius, color)` | Draw a circle | `x`, `y`: Center, `radius`: Radius, `color`: Fill color | None |
| `draw_circle_outline(x, y, radius, color, thickness)` | Draw circle outline | Adds `thickness` parameter | None |
| `draw_line(x1, y1, x2, y2, color)` | Draw a line | `x1`, `y1`, `x2`, `y2`: Coordinates, `color`: Line color | None |
| `draw_line_width(x1, y1, x2, y2, color, width)` | Draw line with width | Adds `width` parameter | None |
| `draw_triangle(x1, y1, x2, y2, x3, y3, color)` | Draw a triangle | Three sets of coordinates and color | None |
| `draw_triangle_outline(x1, y1, x2, y2, x3, y3, color, thickness)` | Draw triangle outline | Adds `thickness` parameter | None |

### Advanced Drawing

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `draw_set_color(color)` | Set drawing color | `color`: Color to use | None |
| `draw_set_font(font)` | Set drawing font | `font`: Font to use | None |
| `draw_set_font_size(size)` | Set font size | `size`: Font size in pixels | None |
| `draw_set_alpha(alpha)` | Set drawing alpha | `alpha`: Alpha value (0-1) | None |
| `draw_set_blend_mode(mode)` | Set blend mode | `mode`: Blend mode ("normal", "add", etc.) | None |
| `draw_set_line_width(width)` | Set line width | `width`: Line width in pixels | None |
| `draw_begin_path()` | Begin a path | None | None |
| `draw_move_to(x, y)` | Move path to position | `x`, `y`: Position | None |
| `draw_line_to(x, y)` | Add line to path | `x`, `y`: End position | None |
| `draw_arc(x, y, r, start_angle, end_angle)` | Add arc to path | Center, radius and angles | None |
| `draw_close_path()` | Close current path | None | None |
| `draw_fill(color)` | Fill current path | `color`: Fill color | None |
| `draw_stroke(color, width)` | Stroke current path | `color`: Stroke color, `width`: Line width | None |

### Camera Functions

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `camera_set_position(x, y)` | Set camera position | `x`, `y`: Position | None |
| `camera_get_x()` | Get camera X position | None | Number |
| `camera_get_y()` | Get camera Y position | None | Number |
| `camera_set_zoom(zoom)` | Set camera zoom | `zoom`: Zoom level (1 = normal) | None |
| `camera_get_zoom()` | Get camera zoom | None | Number |
| `camera_set_rotation(rotation)` | Set camera rotation | `rotation`: Rotation in degrees | None |
| `camera_get_rotation()` | Get camera rotation | None | Number |
| `camera_set_view(x, y, width, height, rotation)` | Set camera view | Position, size and rotation | None |
| `camera_reset()` | Reset camera to defaults | None | None |

## Input Functions

### Keyboard Input

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `keyboard_check(key)` | Check if key is held | `key`: Key code to check | Boolean |
| `keyboard_check_pressed(key)` | Check if key was just pressed | `key`: Key code to check | Boolean |
| `keyboard_check_released(key)` | Check if key was just released | `key`: Key code to check | Boolean |
| `keyboard_clear(key)` | Clear key state | `key`: Key code to clear | None |

### Mouse Input

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `mouse_x` | Current mouse X position | N/A (property) | Number |
| `mouse_y` | Current mouse Y position | N/A (property) | Number |
| `mouse_check(button)` | Check if mouse button is held | `button`: Button to check (0=left, 1=right, 2=middle) | Boolean |
| `mouse_check_pressed(button)` | Check if mouse button was just pressed | `button`: Button to check | Boolean |
| `mouse_check_released(button)` | Check if mouse button was just released | `button`: Button to check | Boolean |
| `mouse_clear(button)` | Clear mouse button state | `button`: Button to clear | None |
| `mouse_wheel_up()` | Check if mouse wheel moved up | None | Boolean |
| `mouse_wheel_down()` | Check if mouse wheel moved down | None | Boolean |

### Touch Input

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `touch_count()` | Get number of active touches | None | Number |
| `touch_x(index)` | Get touch X position | `index`: Touch index | Number |
| `touch_y(index)` | Get touch Y position | `index`: Touch index | Number |
| `touch_check(index)` | Check if touch is active | `index`: Touch index | Boolean |
| `touch_check_pressed(index)` | Check if touch just started | `index`: Touch index | Boolean |
| `touch_check_released(index)` | Check if touch just ended | `index`: Touch index | Boolean |

### Gamepad Input

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `gamepad_count()` | Get number of connected gamepads | None | Number |
| `gamepad_check(pad, button)` | Check if gamepad button is held | `pad`: Gamepad index, `button`: Button index | Boolean |
| `gamepad_check_pressed(pad, button)` | Check if gamepad button was just pressed | `pad`, `button`: Indices | Boolean |
| `gamepad_check_released(pad, button)` | Check if gamepad button was just released | `pad`, `button`: Indices | Boolean |
| `gamepad_axis_value(pad, axis)` | Get gamepad axis value | `pad`: Gamepad index, `axis`: Axis index | Number (-1 to 1) |
| `gamepad_set_vibration(pad, left, right)` | Set gamepad vibration | `pad`: Index, `left`, `right`: Motor strengths | None |

## Audio Functions

### Sound Functions

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `play_sound(sound)` | Play a sound | `sound`: Sound name | Sound ID |
| `play_sound_ext(sound, volume, pitch, loop)` | Play sound with options | Adds volume, pitch and loop options | Sound ID |
| `play_sound_at(sound, x, y, falloff, max_dist)` | Play sound at position | Adds positional parameters | Sound ID |
| `stop_sound(sound_id)` | Stop a sound | `sound_id`: Sound ID to stop | None |
| `pause_sound(sound_id)` | Pause a sound | `sound_id`: Sound ID to pause | None |
| `resume_sound(sound_id)` | Resume a paused sound | `sound_id`: Sound ID to resume | None |
| `set_sound_volume(sound_id, volume)` | Set sound volume | `sound_id`: Sound ID, `volume`: Volume (0-1) | None |
| `set_sound_pitch(sound_id, pitch)` | Set sound pitch | `sound_id`: Sound ID, `pitch`: Pitch multiplier | None |

### Music Functions

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `play_music(music, volume, loop)` | Play background music | `music`: Music name, `volume`: Volume (0-1), `loop`: Boolean | None |
| `stop_music()` | Stop background music | None | None |
| `pause_music()` | Pause background music | None | None |
| `resume_music()` | Resume background music | None | None |
| `set_music_volume(volume)` | Set music volume | `volume`: Volume (0-1) | None |
| `fade_music(volume, time)` | Fade music to volume | `volume`: Target (0-1), `time`: Duration in seconds | None |
| `crossfade_music(music, time)` | Crossfade to new music | `music`: New music, `time`: Fade duration | None |

## Math Functions

### Basic Math

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `Math.abs(x)` | Absolute value | `x`: Input value | Number |
| `Math.sign(x)` | Sign of value (-1, 0, or 1) | `x`: Input value | Number |
| `Math.floor(x)` | Round down to integer | `x`: Input value | Integer |
| `Math.ceil(x)` | Round up to integer | `x`: Input value | Integer |
| `Math.round(x)` | Round to nearest integer | `x`: Input value | Integer |
| `Math.min(a, b, ...)` | Minimum of values | Any number of values | Number |
| `Math.max(a, b, ...)` | Maximum of values | Any number of values | Number |
| `Math.clamp(value, min, max)` | Clamp value between min and max | `value`, `min`, `max`: Values | Number |
| `Math.lerp(a, b, t)` | Linear interpolation | `a`, `b`: Values, `t`: Factor (0-1) | Number |

### Trigonometry

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `Math.sin(x)` | Sine function | `x`: Angle in radians | Number |
| `Math.cos(x)` | Cosine function | `x`: Angle in radians | Number |
| `Math.tan(x)` | Tangent function | `x`: Angle in radians | Number |
| `Math.asin(x)` | Arcsine function | `x`: Value (-1 to 1) | Radians |
| `Math.acos(x)` | Arccosine function | `x`: Value (-1 to 1) | Radians |
| `Math.atan(x)` | Arctangent function | `x`: Value | Radians |
| `Math.atan2(y, x)` | Arctangent of y/x | `y`, `x`: Coordinates | Radians |
| `Math.deg_to_rad(deg)` | Convert degrees to radians | `deg`: Degrees | Radians |
| `Math.rad_to_deg(rad)` | Convert radians to degrees | `rad`: Radians | Degrees |

### Random Functions

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `Math.random()` | Random number between 0-1 | None | Number |
| `Math.random_range(min, max)` | Random number in range | `min`, `max`: Range | Number |
| `Math.random_int(min, max)` | Random integer in range | `min`, `max`: Range | Integer |
| `Math.choose(a, b, ...)` | Choose random argument | Any number of values | Value |
| `Math.irandom(n)` | Random integer from 0 to n-1 | `n`: Upper bound | Integer |
| `Math.set_random_seed(seed)` | Set random seed | `seed`: Seed value | None |

### Distance Functions

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `point_distance(x1, y1, x2, y2)` | Distance between points | Two sets of coordinates | Number |
| `point_direction(x1, y1, x2, y2)` | Direction from point to point | Two sets of coordinates | Degrees |
| `lengthdir_x(length, direction)` | X component from length and direction | `length`: Distance, `direction`: Angle | Number |
| `lengthdir_y(length, direction)` | Y component from length and direction | `length`: Distance, `direction`: Angle | Number |

## Physics Functions

### Collision Functions

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `check_collision(x, y, tag)` | Check collision at position | `x`, `y`: Position, `tag`: Object tag | Object or null |
| `check_collision_rect(x1, y1, x2, y2, tag)` | Check collision in rectangle | Rectangle coordinates, `tag`: Object tag | Array of objects |
| `check_collision_circle(x, y, radius, tag)` | Check collision in circle | `x`, `y`: Center, `radius`: Radius, `tag`: Tag | Array of objects |
| `check_collision_line(x1, y1, x2, y2, tag)` | Check collision along line | Line coordinates, `tag`: Object tag | Array of objects |
| `collision_point(x, y, object)` | Check collision with object at point | `x`, `y`: Position, `object`: Object to check | Boolean |

### Physics Objects

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `physics_create_rectangle(x, y, width, height, angle, dynamic)` | Create physics rectangle | Position, size, angle, and if dynamic | Physics body |
| `physics_create_circle(x, y, radius, dynamic)` | Create physics circle | `x`, `y`: Position, `radius`: Radius, `dynamic`: Boolean | Physics body |
| `physics_create_polygon(x, y, points, dynamic)` | Create physics polygon | `x`, `y`: Position, `points`: Vertex array, `dynamic`: Boolean | Physics body |
| `physics_destroy(body)` | Destroy physics body | `body`: Physics body to destroy | None |
| `physics_apply_force(body, fx, fy)` | Apply force to body | `body`: Physics body, `fx`, `fy`: Force components | None |
| `physics_apply_impulse(body, ix, iy)` | Apply impulse to body | `body`: Physics body, `ix`, `iy`: Impulse components | None |
| `physics_set_velocity(body, vx, vy)` | Set body velocity | `body`: Physics body, `vx`, `vy`: Velocity components | None |
| `physics_get_position(body)` | Get body position | `body`: Physics body | Vec2 |
| `physics_set_position(body, x, y)` | Set body position | `body`: Physics body, `x`, `y`: Position | None |
| `physics_get_rotation(body)` | Get body rotation | `body`: Physics body | Number (degrees) |
| `physics_set_rotation(body, angle)` | Set body rotation | `body`: Physics body, `angle`: Rotation in degrees | None |

## Data Functions

### File I/O

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `file_exists(filename)` | Check if file exists | `filename`: File to check | Boolean |
| `file_read_text(filename)` | Read text file | `filename`: File to read | String |
| `file_write_text(filename, text)` | Write text file | `filename`: File to write, `text`: Content | Boolean |
| `file_append_text(filename, text)` | Append to text file | `filename`: File to append to, `text`: Content | Boolean |
| `file_delete(filename)` | Delete a file | `filename`: File to delete | Boolean |

### Storage Functions

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `save_data(key, value)` | Save value to storage | `key`: Storage key, `value`: Value to store | Boolean |
| `load_data(key)` | Load value from storage | `key`: Storage key | Value or null |
| `data_exists(key)` | Check if key exists in storage | `key`: Storage key | Boolean |
| `delete_data(key)` | Delete value from storage | `key`: Storage key | Boolean |
| `clear_data()` | Clear all stored data | None | None |

### JSON Functions

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `json_stringify(object)` | Convert object to JSON string | `object`: Object to convert | String |
| `json_parse(string)` | Parse JSON string to object | `string`: JSON string | Object |

## Time Functions

### Timing Functions

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `delta_time` | Time since last frame in seconds | N/A (property) | Number |
| `current_time` | Current time in milliseconds | N/A (property) | Number |
| `get_fps()` | Get current framerate | None | Number |
| `game_time` | Time since game started | N/A (property) | Number |
| `set_timeout(callback, time)` | Execute function after delay | `callback`: Function, `time`: Delay in ms | Timer ID |
| `clear_timeout(id)` | Cancel a timeout | `id`: Timer ID to cancel | None |
| `set_interval(callback, time)` | Execute function repeatedly | `callback`: Function, `time`: Interval in ms | Timer ID |
| `clear_interval(id)` | Cancel an interval | `id`: Timer ID to cancel | None |

### Coroutine Functions

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `start_coroutine(generator)` | Start a coroutine | `generator`: Generator function | Coroutine ID |
| `stop_coroutine(id)` | Stop a coroutine | `id`: Coroutine ID | None |
| `wait(seconds)` | Yield coroutine for seconds | `seconds`: Time to wait | Yielder |
| `wait_frames(frames)` | Yield coroutine for frames | `frames`: Frames to wait | Yielder |
| `wait_until(condition)` | Yield until condition is true | `condition`: Function that returns boolean | Yielder |

## UI Functions

### UI Controls

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `ui_button(text, x, y, width, height)` | Create UI button | Position and size parameters | Boolean (clicked) |
| `ui_text_input(text, x, y, width, height)` | Create text input | Position and size parameters | String (input) |
| `ui_slider(value, min, max, x, y, width, height)` | Create slider | Value range and position parameters | Number (value) |
| `ui_checkbox(checked, x, y, size)` | Create checkbox | `checked`: Initial state, position, size | Boolean (checked) |
| `ui_dropdown(options, selected, x, y, width)` | Create dropdown | `options`: String array, position, size | Number (selected index) |
| `ui_panel(x, y, width, height, color)` | Create UI panel | Position, size, color parameters | None |

### Dialog Functions

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `show_message(text)` | Show a message dialog | `text`: Message to show | None |
| `show_question(text)` | Show yes/no dialog | `text`: Question to ask | Boolean |
| `get_string(text, default)` | Show text input dialog | `text`: Prompt, `default`: Default value | String |
| `get_number(text, default)` | Show number input dialog | `text`: Prompt, `default`: Default value | Number |
| `show_menu(text, options)` | Show menu dialog | `text`: Title, `options`: Option array | Number (selected index) |

## Vector Functions

### Vec2 Functions

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `vec2(x, y)` | Create a 2D vector | `x`, `y`: Components | Vec2 |
| `vec2_add(a, b)` | Add vectors | `a`, `b`: Vectors to add | Vec2 |
| `vec2_subtract(a, b)` | Subtract vectors | `a`, `b`: Vectors | Vec2 |
| `vec2_multiply(v, scalar)` | Multiply vector by scalar | `v`: Vector, `scalar`: Number | Vec2 |
| `vec2_divide(v, scalar)` | Divide vector by scalar | `v`: Vector, `scalar`: Number | Vec2 |
| `vec2_length(v)` | Get vector length | `v`: Vector | Number |
| `vec2_normalize(v)` | Normalize vector to unit length | `v`: Vector | Vec2 |
| `vec2_distance(a, b)` | Distance between vectors | `a`, `b`: Vectors | Number |
| `vec2_dot(a, b)` | Dot product of vectors | `a`, `b`: Vectors | Number |
| `vec2_angle(v)` | Angle of vector | `v`: Vector | Degrees |
| `vec2_direction(a, b)` | Direction from vector to vector | `a`, `b`: Vectors | Degrees |
| `vec2_lerp(a, b, t)` | Linear interpolation of vectors | `a`, `b`: Vectors, `t`: Factor (0-1) | Vec2 |

### Vec3 Functions

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `vec3(x, y, z)` | Create a 3D vector | `x`, `y`, `z`: Components | Vec3 |
| `vec3_add(a, b)` | Add vectors | `a`, `b`: Vectors to add | Vec3 |
| `vec3_subtract(a, b)` | Subtract vectors | `a`, `b`: Vectors | Vec3 |
| `vec3_multiply(v, scalar)` | Multiply vector by scalar | `v`: Vector, `scalar`: Number | Vec3 |
| `vec3_divide(v, scalar)` | Divide vector by scalar | `v`: Vector, `scalar`: Number | Vec3 |
| `vec3_length(v)` | Get vector length | `v`: Vector | Number |
| `vec3_normalize(v)` | Normalize vector to unit length | `v`: Vector | Vec3 |
| `vec3_distance(a, b)` | Distance between vectors | `a`, `b`: Vectors | Number |
| `vec3_dot(a, b)` | Dot product of vectors | `a`, `b`: Vectors | Number |
| `vec3_cross(a, b)` | Cross product of vectors | `a`, `b`: Vectors | Vec3 |
| `vec3_lerp(a, b, t)` | Linear interpolation of vectors | `a`, `b`: Vectors, `t`: Factor (0-1) | Vec3 |

## Constants

### Key Codes

| Constant | Value | Description |
|----------|-------|-------------|
| `vk_left` | 37 | Left arrow key |
| `vk_right` | 39 | Right arrow key |
| `vk_up` | 38 | Up arrow key |
| `vk_down` | 40 | Down arrow key |
| `vk_space` | 32 | Space key |
| `vk_enter` | 13 | Enter key |
| `vk_escape` | 27 | Escape key |
| `vk_shift` | 16 | Shift key |
| `vk_control` | 17 | Control key |
| `vk_alt` | 18 | Alt key |
| `vk_tab` | 9 | Tab key |
| `vk_backspace` | 8 | Backspace key |
| `vk_delete` | 46 | Delete key |
| `vk_a` through `vk_z` | 65-90 | Letter keys A-Z |
| `vk_0` through `vk_9` | 48-57 | Number keys 0-9 |

### Blend Modes

| Constant | Description |
|----------|-------------|
| `blend_normal` | Normal blending (default) |
| `blend_add` | Additive blending |
| `blend_subtract` | Subtractive blending |
| `blend_multiply` | Multiply blending |
| `blend_screen` | Screen blending |

### Alignment Constants

| Constant | Description |
|----------|-------------|
| `align_left` | Left text alignment |
| `align_center` | Center text alignment |
| `align_right` | Right text alignment |
| `valign_top` | Top vertical alignment |
| `valign_middle` | Middle vertical alignment |
| `valign_bottom` | Bottom vertical alignment |

## Classes

### GameObject

| Property/Method | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `position` | Object position (Vec2) | N/A (property) | Vec2 |
| `velocity` | Object velocity (Vec2) | N/A (property) | Vec2 |
| `acceleration` | Object acceleration (Vec2) | N/A (property) | Vec2 |
| `rotation` | Object rotation in degrees | N/A (property) | Number |
| `scale` | Object scale (Vec2) | N/A (property) | Vec2 |
| `visible` | Object visibility | N/A (property) | Boolean |
| `active` | Object active state | N/A (property) | Boolean |
| `tag` | Object tag | N/A (property) | String |
| `id` | Unique object ID | N/A (property) | String |
| `components` | Object components | N/A (property) | Array |
| `addComponent(component)` | Add component to object | `component`: Component to add | Component |
| `getComponent(type)` | Get component by type | `type`: Component type | Component or null |
| `removeComponent(component)` | Remove component from object | `component`: Component to remove | Boolean |
| `destroy()` | Destroy the object | None | None |

### Component

| Property/Method | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `gameObject` | Parent game object | N/A (property) | GameObject |
| `enabled` | Component enabled state | N/A (property) | Boolean |
| `id` | Unique component ID | N/A (property) | String |
| `create()` | Called when component is created | None | None |
| `destroy()` | Called when component is destroyed | None | None |
| `update(deltaTime)` | Called every frame | `deltaTime`: Time since last frame | None |
| `draw(ctx)` | Called during rendering | `ctx`: Canvas context | None |

### StateMachine

| Property/Method | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `current_state` | Current state name | N/A (property) | String |
| `states` | State definitions | N/A (property) | Object |
| `constructor(options)` | Create state machine | `options`: Configuration object | StateMachine |
| `change_state(state)` | Change to a new state | `state`: State name | Boolean |
| `update(deltaTime)` | Update current state | `deltaTime`: Time since last frame | None |
| `add_state(name, state)` | Add a new state | `name`: State name, `state`: State definition | None |
| `remove_state(name)` | Remove a state | `name`: State name | Boolean |

### Sprite

| Property/Method | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `name` | Sprite name | N/A (property) | String |
| `width` | Sprite width | N/A (property) | Number |
| `height` | Sprite height | N/A (property) | Number |
| `frame_count` | Number of frames | N/A (property) | Number |
| `frame_speed` | Animation speed | N/A (property) | Number |
| `current_frame` | Current frame index | N/A (property) | Number |
| `draw(x, y)` | Draw sprite at position | `x`, `y`: Position | None |
| `draw_ext(x, y, scale_x, scale_y, rotation, color, alpha)` | Draw with transforms | Multiple transform parameters | None |
| `get_width()` | Get sprite width | None | Number |
| `get_height()` | Get sprite height | None | Number |
| `set_frame(frame)` | Set current animation frame | `frame`: Frame index | None |
| `reset_animation()` | Reset animation to first frame | None | None |
| `update(deltaTime)` | Update animation | `deltaTime`: Time since last frame | None |
| `clone()` | Create a copy of the sprite | None | Sprite |

### Sound

| Property/Method | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `name` | Sound name | N/A (property) | String |
| `duration` | Sound duration in seconds | N/A (property) | Number |
| `volume` | Sound volume (0-1) | N/A (property) | Number |
| `pitch` | Sound pitch multiplier | N/A (property) | Number |
| `loop` | Sound loop state | N/A (property) | Boolean |
| `playing` | Sound playing state | N/A (property) | Boolean |
| `paused` | Sound paused state | N/A (property) | Boolean |
| `play()` | Play the sound | None | None |
| `stop()` | Stop the sound | None | None |
| `pause()` | Pause the sound | None | None |
| `resume()` | Resume the sound | None | None |
| `set_volume(volume)` | Set sound volume | `volume`: Volume (0-1) | None |
| `set_pitch(pitch)` | Set sound pitch | `pitch`: Pitch multiplier | None |
| `set_loop(loop)` | Set sound loop state | `loop`: Boolean | None |
| `fade_to(volume, time)` | Fade to volume | `volume`: Target volume, `time`: Duration | None |

### ParticleSystem

| Property/Method | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `position` | Emitter position | N/A (property) | Vec2 |
| `active` | System active state | N/A (property) | Boolean |
| `max_particles` | Maximum number of particles | N/A (property) | Number |
| `emission_rate` | Particles per second | N/A (property) | Number |
| `particle_life` | Particle lifetime | N/A (property) | Number |
| `spread` | Emission spread angle | N/A (property) | Number |
| `start_color` | Starting particle color | N/A (property) | String |
| `end_color` | Ending particle color | N/A (property) | String |
| `start_size` | Starting particle size | N/A (property) | Number |
| `end_size` | Ending particle size | N/A (property) | Number |
| `gravity` | Gravity effect | N/A (property) | Vec2 |
| `emit(count)` | Emit particles | `count`: Number of particles | None |
| `update(deltaTime)` | Update particles | `deltaTime`: Time since last frame | None |
| `draw(ctx)` | Draw particles | `ctx`: Canvas context | None |
| `start()` | Start emission | None | None |
| `stop()` | Stop emission | None | None |
| `clear()` | Clear all particles | None | None |
| `set_texture(texture)` | Set particle texture | `texture`: Texture name | None |

### Camera

| Property/Method | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `position` | Camera position | N/A (property) | Vec2 |
| `target` | Camera target | N/A (property) | Vec2 |
| `zoom` | Camera zoom level | N/A (property) | Number |
| `rotation` | Camera rotation | N/A (property) | Number |
| `width` | Camera width | N/A (property) | Number |
| `height` | Camera height | N/A (property) | Number |
| `shake_magnitude` | Shake effect magnitude | N/A (property) | Number |
| `shake_duration` | Shake effect duration | N/A (property) | Number |
| `follow(target, speed)` | Follow target | `target`: Object to follow, `speed`: Follow speed | None |
| `move_to(x, y, speed)` | Move to position | `x`, `y`: Target position, `speed`: Move speed | None |
| `shake(magnitude, duration)` | Apply camera shake | `magnitude`: Strength, `duration`: Duration | None |
| `update(deltaTime)` | Update camera | `deltaTime`: Time since last frame | None |
| `world_to_screen(x, y)` | Convert world to screen coords | `x`, `y`: World position | Vec2 |
| `screen_to_world(x, y)` | Convert screen to world coords | `x`, `y`: Screen position | Vec2 |
| `reset()` | Reset camera to defaults | None | None |

### Animation

| Property/Method | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `name` | Animation name | N/A (property) | String |
| `frames` | Animation frames | N/A (property) | Array |
| `frame_count` | Number of frames | N/A (property) | Number |
| `current_frame` | Current frame index | N/A (property) | Number |
| `speed` | Animation speed | N/A (property) | Number |
| `loop` | Animation loop state | N/A (property) | Boolean |
| `playing` | Animation playing state | N/A (property) | Boolean |
| `finished` | Animation finished state | N/A (property) | Boolean |
| `play()` | Play the animation | None | None |
| `stop()` | Stop the animation | None | None |
| `pause()` | Pause the animation | None | None |
| `resume()` | Resume the animation | None | None |
| `set_frame(frame)` | Set current frame | `frame`: Frame index | None |
| `set_speed(speed)` | Set animation speed | `speed`: Speed multiplier | None |
| `set_loop(loop)` | Set loop state | `loop`: Boolean | None |
| `update(deltaTime)` | Update animation | `deltaTime`: Time since last frame | None |
| `clone()` | Create a copy of the animation | None | Animation |

### Tilemap

| Property/Method | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `width` | Map width in tiles | N/A (property) | Number |
| `height` | Map height in tiles | N/A (property) | Number |
| `tile_width` | Tile width in pixels | N/A (property) | Number |
| `tile_height` | Tile height in pixels | N/A (property) | Number |
| `layers` | Map layers | N/A (property) | Array |
| `position` | Map position | N/A (property) | Vec2 |
| `get_tile(layer, x, y)` | Get tile at position | `layer`: Layer index, `x`, `y`: Tile coordinates | Number |
| `set_tile(layer, x, y, tile)` | Set tile at position | `layer`, `x`, `y`, `tile`: Tile index | None |
| `get_tile_world(layer, x, y)` | Get tile at world position | `layer`: Layer index, `x`, `y`: World coordinates | Number |
| `world_to_tile(x, y)` | Convert world to tile coords | `x`, `y`: World position | Vec2 |
| `tile_to_world(x, y)` | Convert tile to world coords | `x`, `y`: Tile position | Vec2 |
| `draw(ctx)` | Draw the tilemap | `ctx`: Canvas context | None |
| `draw_layer(ctx, layer)` | Draw specific layer | `ctx`: Canvas context, `layer`: Layer index | None |
| `set_tileset(tileset)` | Set tilemap tileset | `tileset`: Tileset name | None |
| `load_from_json(json)` | Load map from JSON | `json`: JSON data | Boolean |
