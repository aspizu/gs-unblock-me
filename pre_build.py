# pyright: reportUnusedCallResult=false

from dataclasses import dataclass
from pathlib import Path
from typing import cast

from PIL import Image
from rich import print


@dataclass
class Block:
    x: int = 0
    y: int = 0
    w: int = 1
    h: int = 1
    player: bool = False


@dataclass
class Level:
    path: Path
    w: int
    h: int
    blocks: list[Block]


def display_blocks(blocks: list[Block], w: int, h: int, bw: int = 9, bh: int = 4):
    pixels: list[list[str]] = [[" "] * (w * bw) for _ in range(h * bh)]
    vert = [b for b in blocks if b.w == 1 and b.h > 1]
    horz = [b for b in blocks if b.h == 1]

    for b in horz:
        for y in range(bh):
            x = b.x * bw
            mids = range(1, bh - 1)
            pixels[b.y * bh + y][x] = "|" if y in mids else "+"
            for _ in range(b.w * bw - 2):
                x += 1
                pixels[b.y * bh + y][x] = " " if y in mids else "-"
            x += 1
            pixels[b.y * bh + y][x] = "|" if y in mids else "+"

    for b in vert:
        for x in range(bw):
            y = b.y * bh
            mids = range(1, bw - 1)
            pixels[y][b.x * bw + x] = "-" if x in mids else "+"
            for _ in range(b.h * bh - 2):
                y += 1
                pixels[y][b.x * bw + x] = " " if x in mids else "|"
            y += 1
            pixels[y][b.x * bw + x] = "-" if x in mids else "+"

    print("\n".join("".join(line) for line in pixels))


black = (0, 0, 0)
white = (255, 255, 255)

levels: list[Level] = []

for path in Path("levels").glob("level_*.png"):
    img = Image.open(path)
    blocks: list[Block] = []

    for x in range(img.width):
        curpixel = None
        curblock = None
        for y in range(img.height):
            pixel = cast("tuple[int, ...]", img.getpixel((x, img.height - y - 1)))
            if curpixel != pixel:
                if curblock is not None:
                    blocks.append(curblock)
                curpixel = pixel
                curblock = Block(x, y)
                if curpixel == white or curpixel == black or curpixel[0] == 0:
                    curpixel = None
                    curblock = None
            elif curblock is not None:
                curblock.h += 1
        if curblock is not None:
            blocks.append(curblock)

    for y in range(img.height):
        curpixel = None
        curblock = None
        for x in range(img.width):
            pixel = cast("tuple[int, ...]", img.getpixel((x, img.height - y - 1)))
            if curpixel != pixel:
                if curblock is not None:
                    blocks.append(curblock)
                curpixel = pixel
                curblock = Block(x, y, player=curpixel == black)
                if curpixel != black and (curpixel == white or curpixel[2] == 0):
                    curpixel = None
                    curblock = None
            elif curblock is not None:
                curblock.w += 1
        if curblock is not None:
            blocks.append(curblock)

    print(f"[blue]{path}[/blue]")
    display_blocks(blocks, w=img.width, h=img.height)
    print()
    blocks.sort(key=lambda b: not b.player)
    if not blocks[0].player:
        raise ValueError(f"'{path}' has no player.")
    levels.append(Level(path, img.width, img.height, blocks))

levels.sort(key=lambda lvl: lvl.path)

with open("leveldata.txt", "w") as f:
    f.write(f"{len(levels)}\n")
    for level in levels:
        f.write(f"{level.path}\n")
        f.write(f"{level.w}\n")
        f.write(f"{level.h}\n")
        f.write(f"{len(level.blocks)}\n")
        for block in level.blocks:
            f.write(f"{block.x}\n")
            f.write(f"{block.y}\n")
            f.write(f"{block.w}\n")
            f.write(f"{block.h}\n")

print(f"[green]{len(levels)} levels generated![/green]")
