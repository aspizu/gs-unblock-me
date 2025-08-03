costumes "assets/*.png";
hide;

%define SNAP_SPEED 0.5

struct Block {
    ix = 0, # initial x cell
    iy = 0, # initial y cell
    x = 0, # px
    y = 0, # px
    w = 0, # cells
    h = 0, # cells
    movable = true, # should always be false for the player
    sx = 0, # velocity px
    sy = 0, # velocity px
}

%define getBlockW(BLOCK) (BLOCK.w*cell_size)
%define getBlockH(BLOCK) (BLOCK.h*cell_size)
%define getBlockX2(BLOCK) (BLOCK.x+getBlockW(BLOCK))
%define getBlockY2(BLOCK) (BLOCK.y+getBlockH(BLOCK))
%define isBlockTouching(BLOCK1, BLOCK2) \
    BLOCK2.x < getBlockX2(BLOCK1) and BLOCK1.x < getBlockX2(BLOCK2) and \
    BLOCK2.y < getBlockY2(BLOCK1) and BLOCK1.y < getBlockY2(BLOCK2)
%define isBlockTouchingMouse(BLOCK) \
    BLOCK.x <= mouse_x()-org_x and mouse_x()-org_x < getBlockX2(BLOCK) and \
    BLOCK.y <= mouse_y()-org_y and mouse_y()-org_y < getBlockY2(BLOCK)

# blocks[1] is the player, rest are level blocks
list Block blocks;

%define PLAYER_BLOCK blocks[1]
%define ACTIVE_BLOCK blocks[active_block]

list leveldata "leveldata.txt";

var time = 0;
var cell_size = 48;
var game_w = 6;
var game_h = 6;
var active_block = "";
var level = 1;
var org_x = 0;
var org_y = 0;

onflag {
    setup;
    time = 0;
    forever {
        update;
        draw;
        ui;
        time++;
    }
}

proc setup {
    active_block = "";
    load_level level;
    org_x = -cell_size*game_w/2;
    org_y = -cell_size*game_h/2;
}

proc setup_blocks {
    local i = 1;
    repeat length(blocks) {
        blocks[i].x = blocks[i].ix * cell_size;
        blocks[i].y = blocks[i].iy * cell_size;
        i++;
    }
}

proc update {
    if active_block != "" {
        if mouse_down() {
            if ACTIVE_BLOCK.w == 1 {
                ACTIVE_BLOCK.sy = active_y + mouse_y() - ACTIVE_BLOCK.y;
            } else {
                ACTIVE_BLOCK.sx = active_x + mouse_x() - ACTIVE_BLOCK.x;
            }
        }
    }
    local i = 1;
    repeat length(blocks) {
        if i != active_block {
            local tx = round(blocks[i].x / cell_size) * cell_size;
            local ty = round(blocks[i].y / cell_size) * cell_size;
            blocks[i].sx = (tx - blocks[i].x) * SNAP_SPEED;
            blocks[i].sy = (ty - blocks[i].y) * SNAP_SPEED;
            if abs(tx - blocks[i].x) < 2 {
                blocks[i].x = tx;
                blocks[i].sx = 0;
            }
            if abs(ty - blocks[i].y) < 2 {
                blocks[i].y = ty;
                blocks[i].sy = 0;
            }
        }
        move_x i, round(blocks[i].sx);
        move_y i, round(blocks[i].sy);
        i++;
    }
    select_block_on_click;
}

proc select_block_on_click {
    if active_block != "" {
        if not mouse_down() {
            active_block = "";
        }
        stop_this_script;
    } elif not mouse_down() {
        stop_this_script;
    }
    local i = 1;
    repeat length(blocks){
        if isBlockTouchingMouse(blocks[i]) {
            active_block = i;
            active_x = ACTIVE_BLOCK.x - mouse_x();
            active_y = ACTIVE_BLOCK.y - mouse_y();
        }
        i++;
    }
}

proc move_x idx, sx {
    local step_size = cell_size // 2;
    local steps = abs($sx) // step_size;
    repeat steps {
        if $sx > 0 {
            _move_x $idx, step_size;
        } else {
            _move_x $idx, -step_size;
        }
    }
    local dx = abs($sx) - steps*step_size;
    if $sx > 0 {
        _move_x $idx, dx;
    } else {
        _move_x $idx, -dx;
    }
}

proc _move_x idx, sx {
    blocks[$idx].x += $sx;
    local i = 1;
    repeat length(blocks) {
        if i != $idx {
            local Block b = blocks[i];
            b.x = round(b.x / cell_size) * cell_size;
            b.y = round(b.y / cell_size) * cell_size;
            if isBlockTouching(blocks[$idx], b) {
                if 0 < $sx {
                    blocks[$idx].x = b.x - getBlockW(blocks[$idx]);
                } else {
                    blocks[$idx].x = getBlockX2(b);
                }
                blocks[$idx].sx = 0;
            }
        }
        i++;
    }
    if blocks[$idx].x < 0 {
        blocks[$idx].x = 0;
        blocks[$idx].sx = 0;
    }
    local exit_y = (game_h//2)*cell_size;
    local outside_exit = blocks[$idx].y < exit_y or blocks[$idx].y >= exit_y + cell_size;
    if getBlockX2(blocks[$idx]) > game_w * cell_size and (outside_exit or $idx > 1) {
        blocks[$idx].x = game_w * cell_size - getBlockW(blocks[$idx]);
        blocks[$idx].sx = 0;
    }
    if $idx == 1 and blocks[$idx].y == exit_y and blocks[$idx].x > game_w*cell_size {
        blocks[$idx].x = game_w*cell_size;
        blocks[$idx].sx = 0;
    }
}

proc move_y idy, sy {
    local step_size = cell_size // 2;
    local steps = abs($sy) // step_size;
    repeat steps {
        if $sy > 0 {
            _move_y $idy, step_size;
        } else {
            _move_y $idy, -step_size;
        }
    }
    local dy = abs($sy) - steps*step_size;
    if $sy > 0 {
        _move_y $idy, dy;
    } else {
        _move_y $idy, -dy;
    }
}

proc _move_y idx, sy {
    blocks[$idx].y += $sy;
    local i = 1;
    repeat length(blocks) {
        if i != $idx {
            local Block b = blocks[i];
            b.x = round(b.x / cell_size) * cell_size;
            b.y = round(b.y / cell_size) * cell_size;
            if isBlockTouching(blocks[$idx], b) {
                if 0 < $sy {
                    blocks[$idx].y = b.y - getBlockH(blocks[$idx]);
                } else {
                    blocks[$idx].y = getBlockY2(b);
                }
                blocks[$idx].sy = 0;
            }
        }
        i++;
    }
    if blocks[$idx].y < 0 {
        blocks[$idx].y = 0;
        blocks[$idx].sy = 0;
    }
    if getBlockY2(blocks[$idx]) > game_h * cell_size {
        blocks[$idx].y = game_h * cell_size - getBlockH(blocks[$idx]);
        blocks[$idx].sy = 0;
    }
}

proc draw {
    erase_all;
    draw_blocks org_x, org_y;
}

proc draw_blocks x, y {
    local type = "player";
    local i = 1;
    repeat length(blocks) {
        goto $x + blocks[i].x + cell_size/2, $y + blocks[i].y + cell_size/2;
        if i == active_block or (active_block == "" and isBlockTouchingMouse(blocks[i])) {
            set_brightness_effect 10;
        } else {
            set_brightness_effect 0;
        }
        if blocks[i].w == 1 {
            # vertical block
            switch_costume "vert_" & type & "_start";
            stamp;
            change_y cell_size;
            switch_costume "vert_" & type & "_mid";
            repeat blocks[i].h - 2 {
                stamp;
                change_y cell_size;
            }
            switch_costume "vert_" & type & "_end";
            stamp;
        } else {
            # horizontal block
            switch_costume "horz_" & type & "_start";
            stamp;
            change_x cell_size;
            switch_costume "horz_" & type & "_mid";
            repeat blocks[i].w - 2 {
                stamp;
                change_x cell_size;
            }
            switch_costume "horz_" & type & "_end";
            stamp;
        }
        local type = "block";
        i++;
    }
}

proc load_level level_no {
    local i = 1;
    i++; # skip levels count
    repeat $level_no - 1 {
        i += 3; # skip path, w, h
        i += 1 + leveldata[i] * 4; # skip blocks
    }
    game_w = leveldata[i + 1];
    game_h = leveldata[i + 2];
    blockslen = leveldata[i + 3];
    delete blocks;
    repeat blockslen {
        i += 4;
        add Block {
            ix: leveldata[i+0],
            iy: leveldata[i+1],
            w: leveldata[i+2],
            h: leveldata[i+3],
        } to blocks;
    }
    setup_blocks;
}

proc ui {
    if clicked != "" and not mouse_down() {
        clicked = "";
    }
    if button("arrow_left", -200, 0) {
        if level > 1 {
            level--;
            setup;
        }
    }
    if button("arrow_right", 200, 0) {
        if level < leveldata[1] {
            level++;
            setup;
        }
    }
    if clicked != "" and mouse_down() {
        clicked = "nothing";
    }
}

var clicked = "";

func button(image, x, y) {
    goto $x, $y;
    switch_costume $image;
    if touching_mouse_pointer() {
        set_brightness_effect 10;
    } else {
        set_brightness_effect 0;
    }
    stamp;
    if clicked != "" and touching_mouse_pointer() and mouse_down() {
        clicked = "button/" & $image;
        return true;
    }
    return false;
}
